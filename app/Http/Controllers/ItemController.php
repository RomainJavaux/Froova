<?php

namespace App\Http\Controllers;

use App\Enums\ItemCategory;
use App\Enums\ReheatMethod;
use App\Http\Requests\Items\ItemRequest;
use App\Http\Resources\ItemResource;
use App\Http\Resources\MovementResource;
use App\Models\Compartment;
use App\Models\Freezer;
use App\Models\Household;
use App\Models\Item;
use App\Services\Inventory;
use App\Services\PhotoStore;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    public function __construct(
        private readonly Inventory $inventory,
        private readonly PhotoStore $photos,
    ) {}

    public function index(Request $request): Response
    {
        $household = $this->household($request);

        $items = $household->items()
            ->inStock()
            ->with('placements.compartment.freezer')
            ->orderBy('best_before')
            ->orderBy('name')
            ->get();

        $finished = $household->items()
            ->finished()
            ->latest('finished_at')
            ->limit(40)
            ->get();

        return Inertia::render('items/index', [
            'items' => ItemResource::collection($items)->resolve($request),
            'finished' => ItemResource::collection($finished)->resolve($request),
            'freezers' => $household->freezers()->get(['id', 'name', 'color', 'type']),
        ]);
    }

    public function create(Request $request): Response
    {
        $household = $this->household($request);
        $source = null;

        if ($request->filled('from')) {
            $source = $household->items()->find($request->integer('from'));
        }

        return Inertia::render('items/form', [
            'item' => null,
            'source' => $source ? ItemResource::make($source)->resolve($request) : null,
            'defaultCompartmentId' => $request->integer('compartment') ?: $source?->placements()->value('compartment_id'),
            'freezers' => $this->freezerOptions($household),
            'suggestions' => $this->suggestions($household),
        ]);
    }

    public function store(ItemRequest $request): RedirectResponse
    {
        $household = $this->household($request);
        $data = $request->validated();

        $item = new Item([
            ...Arr::except($data, ['photo', 'remove_photo', 'placements']),
            'household_id' => $household->id,
            'best_before' => $data['best_before'] ?? $this->defaultBestBefore($data),
            'tags' => $this->cleanTags($data['tags'] ?? []),
            ...$this->preparation($data),
        ]);

        if ($request->hasFile('photo')) {
            $item->photo_path = $this->photos->store($request->file('photo'), "items/{$household->id}");
        } elseif ($request->filled('photo_from')) {
            $item->photo_path = $this->copyPhotoFrom($household, $request->integer('photo_from'));
        }

        $placements = $request->placements();
        $this->inventory->add($item, $this->user($request), $placements);

        $compartment = Compartment::query()->findOrFail($placements[0]['compartment_id']);
        $where = count($placements) > 1 ? count($placements).' tiroirs' : $compartment->name;

        Inertia::flash('celebrate', true);
        $this->toast("{$item->name} rangé dans {$where} ❄️");

        return to_route('freezers.show', [
            'freezer' => $compartment->freezer_id,
            'compartment' => $compartment->id,
            'item' => $item->id,
        ]);
    }

    public function show(Request $request, Item $item): Response
    {
        Gate::authorize('view', $item);

        if ($this->household($request)->id !== $item->household_id) {
            $this->user($request)->switchHousehold($item->household);
            $request->attributes->set('household', $item->household);
        }

        $item->load(['placements.compartment.freezer', 'creator']);

        $movements = $item->movements()
            ->with(['user', 'fromCompartment', 'toCompartment'])
            ->limit(30)
            ->get();

        return Inertia::render('items/show', [
            'item' => ItemResource::make($item)->resolve($request),
            'movements' => MovementResource::collection($movements)->resolve($request),
            'freezers' => $this->freezerOptions($item->household),
        ]);
    }

    /**
     * Printable label sized for a label printer (90×38 mm detailed, or 29×29 mm QR code).
     */
    public function label(Request $request, Item $item): Response
    {
        Gate::authorize('view', $item);

        return Inertia::render('items/label', [
            'item' => ItemResource::make($item)->resolve($request),
            'format' => $request->query('format') === 'square' ? 'square' : 'detailed',
        ]);
    }

    public function edit(Request $request, Item $item): Response
    {
        Gate::authorize('update', $item);

        $item->load('placements.compartment.freezer');

        return Inertia::render('items/form', [
            'item' => ItemResource::make($item)->resolve($request),
            'source' => null,
            'defaultCompartmentId' => null,
            'freezers' => $this->freezerOptions($item->household),
            'suggestions' => [],
        ]);
    }

    public function update(ItemRequest $request, Item $item): RedirectResponse
    {
        Gate::authorize('update', $item);

        $data = $request->validated();

        $item->fill([
            ...Arr::except($data, ['photo', 'remove_photo', 'placements']),
            'best_before' => $data['best_before'] ?? $this->defaultBestBefore($data),
            'tags' => $this->cleanTags($data['tags'] ?? []),
            ...$this->preparation($data),
        ]);

        if ($request->hasFile('photo')) {
            $this->photos->delete($item->photo_path);
            $item->photo_path = $this->photos->store($request->file('photo'), "items/{$item->household_id}");
        } elseif ($request->boolean('remove_photo')) {
            $this->photos->delete($item->photo_path);
            $item->photo_path = null;
        }

        $item->save();
        $this->inventory->relocate($item, $this->user($request), $request->placements());

        $this->toast('Modifications enregistrées');

        return to_route('items.show', $item);
    }

    public function destroy(Item $item): RedirectResponse
    {
        Gate::authorize('delete', $item);

        $this->photos->delete($item->photo_path);
        $item->delete();

        $this->toast("{$item->name} a été supprimé");

        return to_route('items.index');
    }

    /**
     * Freezers with their compartments, for the visual location picker.
     *
     * @return list<array<string, mixed>>
     */
    private function freezerOptions(Household $household): array
    {
        return array_values($household->freezers()
            ->with(['compartments' => fn ($query) => $query->withCount('placements')])
            ->get()
            ->map(fn (Freezer $freezer) => [
                'id' => $freezer->id,
                'name' => $freezer->name,
                'type' => $freezer->type->value,
                'color' => $freezer->color,
                'location' => $freezer->location,
                'compartments' => $freezer->compartments->map(fn ($compartment) => [
                    'id' => $compartment->id,
                    'name' => $compartment->name,
                    'position' => $compartment->position,
                    'itemsCount' => (int) $compartment->getAttribute('placements_count'),
                ])->values()->all(),
            ])
            ->all());
    }

    /**
     * Previously frozen dishes, to refill the form in one tap.
     *
     * @return list<array<string, mixed>>
     */
    private function suggestions(Household $household): array
    {
        return array_values($household->items()
            ->latest('id')
            ->limit(200)
            ->get(['id', 'name', 'emoji', 'category', 'unit', 'servings', 'thaw', 'reheat_method', 'reheat_minutes', 'reheat_temperature', 'extras', 'reheat_notes'])
            ->unique(fn (Item $item) => Str::lower($item->name))
            ->take(40)
            ->map(fn (Item $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'emoji' => $item->displayEmoji(),
                'category' => $item->category->value,
                'unit' => $item->unit->value,
                'servings' => $item->servings,
                ...ItemResource::preparation($item),
            ])
            ->all());
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function defaultBestBefore(array $data): Carbon
    {
        $category = ItemCategory::from((string) $data['category']);

        return Carbon::parse((string) $data['frozen_on'])->addMonthsNoOverflow($category->shelfLifeMonths());
    }

    /**
     * @param  array<int, string>  $tags
     * @return list<string>
     */
    private function cleanTags(array $tags): array
    {
        return array_values(collect($tags)
            ->map(fn (string $tag) => Str::of($tag)->trim()->lower()->toString())
            ->filter()
            ->unique()
            ->all());
    }

    /**
     * Every preparation field is written, so leaving one empty clears it.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function preparation(array $data): array
    {
        $method = isset($data['reheat_method']) ? ReheatMethod::from((string) $data['reheat_method']) : null;

        return [
            'thaw' => $data['thaw'] ?? null,
            'reheat_method' => $method,
            // Cold dishes have no reheating time; only the oven and the air fryer need a temperature.
            'reheat_minutes' => $method === ReheatMethod::Cold ? null : ($data['reheat_minutes'] ?? null),
            'reheat_temperature' => $method?->usesTemperature() ? ($data['reheat_temperature'] ?? null) : null,
            'extras' => $this->cleanExtras((array) ($data['extras'] ?? [])),
            'reheat_notes' => $data['reheat_notes'] ?? null,
        ];
    }

    /**
     * Extra ingredients keep their case ("Parmesan") but lose blanks and duplicates.
     *
     * @param  array<int, string|null>  $extras
     * @return list<string>|null
     */
    private function cleanExtras(array $extras): ?array
    {
        $clean = array_values(collect($extras)
            ->map(fn (?string $extra) => Str::of((string) $extra)->squish()->ucfirst()->toString())
            ->filter()
            ->unique(fn (string $extra) => Str::lower($extra))
            ->all());

        return $clean ?: null;
    }

    private function copyPhotoFrom(Household $household, int $itemId): ?string
    {
        $path = $household->items()->find($itemId)?->photo_path;

        if (! $path || ! Storage::disk('public')->exists($path)) {
            return null;
        }

        $copy = "items/{$household->id}/".Str::uuid7().'.webp';
        Storage::disk('public')->copy($path, $copy);

        return $copy;
    }
}
