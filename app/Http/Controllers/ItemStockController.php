<?php

namespace App\Http\Controllers;

use App\Models\Compartment;
use App\Models\Item;
use App\Services\Inventory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ItemStockController extends Controller
{
    public function __construct(private readonly Inventory $inventory) {}

    public function take(Request $request, Item $item): RedirectResponse
    {
        Gate::authorize('update', $item);

        $validated = $request->validate([
            'compartment_id' => ['nullable', 'integer'],
        ]);

        // From a given compartment, at most what is stored there.
        $available = isset($validated['compartment_id'])
            ? (int) $item->placements()->where('compartment_id', $validated['compartment_id'])->sum('quantity')
            : $item->quantity;

        $validated += $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:'.max(1, $available)],
        ]);

        $item = $this->inventory->take($item, $this->user($request), (int) $validated['quantity'], $validated['compartment_id'] ?? null);

        $unit = $item->unit;

        if ($item->quantity === 0) {
            Inertia::flash('finished', ['id' => $item->id, 'name' => $item->name]);
            $this->toast("Bon appétit ! Il n’y a plus de {$item->name} au congélo 🍽️");
        } else {
            $this->toast("Bon appétit ! Il reste {$unit->format($item->quantity)} de {$item->name}");
        }

        return back();
    }

    public function restock(Request $request, Item $item): RedirectResponse
    {
        Gate::authorize('update', $item);

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:999'],
            'compartment_id' => ['nullable', 'integer'],
        ]);

        $compartment = $this->compartmentFor($item, $validated['compartment_id'] ?? null);

        if ($compartment === null && ! $item->placements()->exists()) {
            throw ValidationException::withMessages(['compartment_id' => 'Choisis le tiroir où tu ranges ces portions.']);
        }

        $item = $this->inventory->restock($item, $this->user($request), (int) $validated['quantity'], $compartment);

        Inertia::flash('celebrate', true);
        $this->toast("{$item->name} : {$item->unit->format($item->quantity)} en stock");

        return back();
    }

    public function move(Request $request, Item $item): RedirectResponse
    {
        Gate::authorize('update', $item);

        $validated = $request->validate([
            'compartment_id' => ['required', 'integer'],
            'from_compartment_id' => ['nullable', 'integer'],
            'from_unplaced' => ['sometimes', 'boolean'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:999'],
        ]);

        $compartment = $this->compartmentFor($item, (int) $validated['compartment_id']);
        abort_if($compartment === null, 422);

        $this->inventory->move(
            $item,
            $this->user($request),
            $compartment,
            $validated['from_compartment_id'] ?? null,
            isset($validated['quantity']) ? (int) $validated['quantity'] : null,
            $request->boolean('from_unplaced'),
        );

        $this->toast("{$item->name} déplacé dans {$compartment->name}");

        return back();
    }

    public function discard(Request $request, Item $item): RedirectResponse
    {
        Gate::authorize('update', $item);

        $validated = $request->validate([
            'note' => ['nullable', 'string', 'max:200'],
            'reason' => ['nullable', Rule::in(['expired', 'freezer_burn', 'other'])],
        ]);

        $this->inventory->discard($item, $this->user($request), $validated['note'] ?? null);

        $this->toast("{$item->name} retiré du congélateur", 'info');

        return back();
    }

    private function compartmentFor(Item $item, ?int $compartmentId): ?Compartment
    {
        if ($compartmentId === null) {
            return null;
        }

        return Compartment::query()
            ->whereKey($compartmentId)
            ->whereHas('freezer', fn ($query) => $query->where('household_id', $item->household_id))
            ->first();
    }
}
