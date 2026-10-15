<?php

namespace App\Http\Controllers;

use App\Models\Compartment;
use App\Models\Item;
use App\Services\Inventory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ItemStockController extends Controller
{
    public function __construct(private readonly Inventory $inventory) {}

    public function take(Request $request, Item $item): RedirectResponse
    {
        Gate::authorize('update', $item);

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:'.max(1, $item->quantity)],
        ]);

        $item = $this->inventory->take($item, $this->user($request), (int) $validated['quantity']);

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
        ]);

        $compartment = $this->compartmentFor($item, (int) $validated['compartment_id']);
        abort_if($compartment === null, 422);

        $this->inventory->move($item, $this->user($request), $compartment);

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
