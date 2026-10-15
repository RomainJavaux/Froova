<?php

namespace App\Http\Controllers;

use App\Actions\Freezers\SaveFreezer;
use App\Http\Requests\Freezers\FreezerRequest;
use App\Http\Resources\FreezerResource;
use App\Models\Freezer;
use App\Models\Item;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class FreezerController extends Controller
{
    public function index(Request $request): Response
    {
        $freezers = $this->household($request)->freezers()
            ->with(['compartments.items' => fn ($query) => $query->inStock()->orderBy('best_before')])
            ->get();

        return Inertia::render('freezers/index', [
            'freezers' => FreezerResource::collection($freezers)->resolve($request),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('freezers/form', [
            'freezer' => null,
        ]);
    }

    public function store(FreezerRequest $request, SaveFreezer $saveFreezer): RedirectResponse
    {
        /** @var array{name: string, type: string, color: string, location?: string|null, notes?: string|null, last_defrosted_on?: string|null, compartments: list<array{id?: int|null, name: string, color?: string|null}>} $data */
        $data = $request->validated();

        $freezer = $saveFreezer->handle($this->household($request), $data);

        $this->toast("{$freezer->name} est prêt à être rempli ❄️");

        return to_route('freezers.show', $freezer);
    }

    public function show(Request $request, Freezer $freezer): Response
    {
        Gate::authorize('view', $freezer);
        $this->ensureCurrentHousehold($request, $freezer);

        $freezer->load(['compartments.items' => fn ($query) => $query
            ->inStock()
            ->with('creator')
            ->orderBy('best_before')
            ->orderBy('name')]);

        return Inertia::render('freezers/show', [
            'freezer' => FreezerResource::make($freezer)->resolve($request),
            'focus' => [
                'compartment' => $request->integer('compartment') ?: null,
                'item' => $request->integer('item') ?: null,
            ],
            'otherFreezers' => $this->household($request)->freezers()
                ->whereKeyNot($freezer->id)
                ->with('compartments')
                ->get()
                ->map(fn (Freezer $other) => [
                    'id' => $other->id,
                    'name' => $other->name,
                    'compartments' => $other->compartments->map->only('id', 'name')->values(),
                ]),
        ]);
    }

    public function edit(Request $request, Freezer $freezer): Response
    {
        Gate::authorize('update', $freezer);

        $freezer->load(['compartments' => fn ($query) => $query->withCount(['items' => fn ($items) => $items->inStock()])]);

        return Inertia::render('freezers/form', [
            'freezer' => FreezerResource::make($freezer)->resolve($request),
        ]);
    }

    public function update(FreezerRequest $request, Freezer $freezer, SaveFreezer $saveFreezer): RedirectResponse
    {
        Gate::authorize('update', $freezer);

        /** @var array{name: string, type: string, color: string, location?: string|null, notes?: string|null, last_defrosted_on?: string|null, compartments: list<array{id?: int|null, name: string, color?: string|null}>} $data */
        $data = $request->validated();

        $saveFreezer->handle($freezer->household, $data, $freezer);

        $this->toast('Congélateur mis à jour');

        return to_route('freezers.show', $freezer);
    }

    public function destroy(Freezer $freezer): RedirectResponse
    {
        Gate::authorize('delete', $freezer);

        // Food stays in the inventory as "to put away" rather than vanishing with the freezer.
        Item::query()
            ->whereIn('compartment_id', $freezer->compartments()->pluck('id'))
            ->update(['compartment_id' => null]);

        $freezer->delete();

        $this->toast("{$freezer->name} a été supprimé");

        return to_route('freezers.index');
    }

    /**
     * Follow a shared link into another household the user belongs to.
     */
    private function ensureCurrentHousehold(Request $request, Freezer $freezer): void
    {
        if ($this->household($request)->id !== $freezer->household_id) {
            $this->user($request)->switchHousehold($freezer->household);
            $request->attributes->set('household', $freezer->household);
        }
    }
}
