<?php

namespace App\Http\Controllers;

use App\Enums\ItemCategory;
use App\Http\Requests\Items\ItemRequest;
use App\Http\Resources\ItemResource;
use App\Http\Resources\MovementResource;
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
            ->with('compartment.freezer')
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
            'defaultCompartmentId' => $request->integer('compartment') ?: $source?->compartment_id,
            'freezers' => $this->freezerOptions($household),
            'suggestions' => $this->suggestions($household),
        ]);
    }

    public function store(ItemRequest $request): RedirectResponse
    {
        $household = $this->household($request);
        $data = $request->validated();

        $item = new Item([
            ...Arr::except($data, ['photo', 'remove_photo']),
            'household_id' => $household->id,
            'best_before' => $data['best_before'] ?? $this->defaultBestBefore($data),
            'tags' => $this->cleanTags($data['tags'] ?? []),
        ]);

        if ($request->hasFile('photo')) {
            $item->photo_path = $this->photos->store($request->file('photo'), "items/{$household->id}");
        } elseif ($request->filled('photo_from')) {
            $item->photo_path = $this->copyPhotoFrom($household, $request->integer('photo_from'));
        }

        $this->inventory->add($item, $this->user($request));

        $compartment = $request->compartment();

        Inertia::flash('celebrate', true);
        $this->toast("{$item->name} rangé dans {$compartment->name} ❄️");

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

        $item->load(['compartment.freezer', 'creator']);

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

    public function edit(Request $request, Item $item): Response
    {
        Gate::authorize('update', $item);

        $item->load('compartment.freezer');

        return Inertia::render('items/form', [
            'item' => ItemResource::make($item)->resolve($request),
            'source' => null,
            'defaultCompartmentId' => $item->compartment_id,
            'freezers' => $this->freezerOptions($item->household),
            'suggestions' => [],
        ]);
    }

    public function update(ItemRequest $request, Item $item): RedirectResponse
    {
        Gate::authorize('update', $item);

        $data = $request->validated();
        $previousCompartment = $item->compartment_id;

        $item->fill([
            ...Arr::except($data, ['photo', 'remove_photo', 'compartment_id']),
            'best_before' => $data['best_before'] ?? $this->defaultBestBefore($data),
            'tags' => $this->cleanTags($data['tags'] ?? []),
        ]);

        if (isset($data['quantity'])) {
            $item->initial_quantity = max($item->initial_quantity, $item->quantity);
            $item->finished_at = null;
        }

        if ($request->hasFile('photo')) {
            $this->photos->delete($item->photo_path);
            $item->photo_path = $this->photos->store($request->file('photo'), "items/{$item->household_id}");
        } elseif ($request->boolean('remove_photo')) {
            $this->photos->delete($item->photo_path);
            $item->photo_path = null;
        }

        $item->save();
        $this->inventory->updated($item, $this->user($request));

        if ($previousCompartment !== (int) $data['compartment_id']) {
            $this->inventory->move($item, $this->user($request), $request->compartment());
        }

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
        return $household->freezers()
            ->with(['compartments' => fn ($query) => $query->withCount(['items' => fn ($items) => $items->inStock()])])
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
                    'itemsCount' => (int) $compartment->getAttribute('items_count'),
                ])->values()->all(),
            ])
            ->values()
            ->all();
    }

    /**
     * Previously frozen dishes, to refill the form in one tap.
     *
     * @return list<array<string, mixed>>
     */
    private function suggestions(Household $household): array
    {
        return $household->items()
            ->latest('id')
            ->limit(200)
            ->get(['id', 'name', 'emoji', 'category', 'unit', 'servings'])
            ->unique(fn (Item $item) => Str::lower($item->name))
            ->take(40)
            ->map(fn (Item $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'emoji' => $item->displayEmoji(),
                'category' => $item->category->value,
                'unit' => $item->unit->value,
                'servings' => $item->servings,
            ])
            ->values()
            ->all();
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
        return collect($tags)
            ->map(fn (string $tag) => Str::of($tag)->trim()->lower()->toString())
            ->filter()
            ->unique()
            ->values()
            ->all();
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
