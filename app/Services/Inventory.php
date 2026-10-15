<?php

namespace App\Services;

use App\Enums\MovementType;
use App\Models\Compartment;
use App\Models\Item;
use App\Models\ItemMovement;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Every change to the freezer stock goes through here so the activity log stays complete.
 */
class Inventory
{
    public function add(Item $item, User $user): Item
    {
        return DB::transaction(function () use ($item, $user) {
            $item->fill([
                'created_by' => $user->id,
                'initial_quantity' => $item->quantity,
            ])->save();

            $this->record($item, $user, MovementType::Added, $item->quantity, toCompartmentId: $item->compartment_id);

            return $item;
        });
    }

    public function take(Item $item, User $user, int $quantity): Item
    {
        return DB::transaction(function () use ($item, $user, $quantity) {
            $item = Item::query()->lockForUpdate()->findOrFail($item->id);
            $quantity = min($quantity, $item->quantity);

            $item->quantity -= $quantity;

            if ($item->quantity === 0) {
                $item->finished_at = now();
            }

            $item->save();

            $this->record($item, $user, MovementType::Taken, $quantity, fromCompartmentId: $item->compartment_id);

            return $item;
        });
    }

    public function restock(Item $item, User $user, int $quantity, ?Compartment $compartment = null): Item
    {
        return DB::transaction(function () use ($item, $user, $quantity, $compartment) {
            $item = Item::query()->lockForUpdate()->findOrFail($item->id);

            $item->quantity += $quantity;
            $item->initial_quantity = max($item->initial_quantity, $item->quantity);
            $item->finished_at = null;

            if ($compartment !== null) {
                $item->compartment_id = $compartment->id;
            }

            $item->save();

            $this->record($item, $user, MovementType::Restocked, $quantity, toCompartmentId: $item->compartment_id);

            return $item;
        });
    }

    public function move(Item $item, User $user, Compartment $compartment): Item
    {
        if ($item->compartment_id === $compartment->id) {
            return $item;
        }

        return DB::transaction(function () use ($item, $user, $compartment) {
            $from = $item->compartment_id;

            $item->compartment()->associate($compartment)->save();

            $this->record($item, $user, MovementType::Moved, null, $from, $compartment->id);

            return $item;
        });
    }

    public function discard(Item $item, User $user, ?string $note = null): Item
    {
        return DB::transaction(function () use ($item, $user, $note) {
            $quantity = $item->quantity;

            $item->fill(['quantity' => 0, 'finished_at' => now()])->save();

            $this->record($item, $user, MovementType::Discarded, $quantity, fromCompartmentId: $item->compartment_id, note: $note);

            return $item;
        });
    }

    public function updated(Item $item, User $user): void
    {
        $this->record($item, $user, MovementType::Updated, null);
    }

    private function record(
        Item $item,
        User $user,
        MovementType $type,
        ?int $quantity,
        ?int $fromCompartmentId = null,
        ?int $toCompartmentId = null,
        ?string $note = null,
    ): ItemMovement {
        return ItemMovement::query()->create([
            'household_id' => $item->household_id,
            'item_id' => $item->id,
            'user_id' => $user->id,
            'type' => $type,
            'item_name' => $item->name,
            'item_emoji' => $item->displayEmoji(),
            'quantity' => $quantity,
            'from_compartment_id' => $fromCompartmentId,
            'to_compartment_id' => $toCompartmentId,
            'note' => $note,
        ]);
    }
}
