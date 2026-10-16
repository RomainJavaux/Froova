<?php

namespace App\Services;

use App\Enums\MovementType;
use App\Models\Compartment;
use App\Models\Item;
use App\Models\ItemMovement;
use App\Models\ItemPlacement;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Every change to the freezer stock goes through here so the activity log stays complete.
 *
 * A batch can be split across several compartments (placements); `items.quantity` is always
 * the sum of its placements.
 */
class Inventory
{
    /**
     * @param  list<array{compartment_id: int|null, quantity: int}>  $placements
     */
    public function add(Item $item, User $user, array $placements): Item
    {
        $placements = $this->normalize($placements);

        return DB::transaction(function () use ($item, $user, $placements) {
            $total = $placements->sum('quantity');

            $item->fill([
                'created_by' => $user->id,
                'quantity' => $total,
                'initial_quantity' => $total,
                'finished_at' => null,
            ])->save();

            foreach ($placements as $placement) {
                $item->placements()->create($placement);
                $this->record($item, $user, MovementType::Added, $placement['quantity'], toCompartmentId: $placement['compartment_id']);
            }

            return $item;
        });
    }

    /**
     * Take portions, from a given compartment or (without one) from the biggest placements first.
     */
    public function take(Item $item, User $user, int $quantity, ?int $compartmentId = null): Item
    {
        return DB::transaction(function () use ($item, $user, $quantity, $compartmentId) {
            $item = Item::query()->lockForUpdate()->findOrFail($item->id);
            $placements = $item->placements()->lockForUpdate()->get();

            if ($compartmentId !== null) {
                $placements = $placements->where('compartment_id', $compartmentId)->values();
            }

            $remaining = $quantity;

            foreach ($placements as $placement) {
                if ($remaining <= 0) {
                    break;
                }

                $taken = min($remaining, $placement->quantity);
                $this->decrement($placement, $taken);
                $remaining -= $taken;

                $this->record($item, $user, MovementType::Taken, $taken, fromCompartmentId: $placement->compartment_id);
            }

            return $this->refreshQuantity($item);
        });
    }

    public function restock(Item $item, User $user, int $quantity, ?Compartment $compartment = null): Item
    {
        return DB::transaction(function () use ($item, $user, $quantity, $compartment) {
            $item = Item::query()->lockForUpdate()->findOrFail($item->id);

            if ($compartment === null && ! $item->placements()->exists()) {
                throw new InvalidArgumentException('A compartment is required to restock a finished batch.');
            }

            // Without a compartment, the portions join the batch's main placement.
            $compartmentId = $compartment->id ?? $item->placements()->value('compartment_id');

            $this->increment($item, $compartmentId, $quantity);
            $this->record($item, $user, MovementType::Restocked, $quantity, toCompartmentId: $compartmentId);

            $item = $this->refreshQuantity($item);
            $item->initial_quantity = max($item->initial_quantity, $item->quantity);
            $item->save();

            return $item;
        });
    }

    /**
     * Move portions from one placement (the main one by default) to another compartment.
     */
    public function move(Item $item, User $user, Compartment $to, ?int $fromCompartmentId = null, ?int $quantity = null, bool $fromUnplaced = false): Item
    {
        return DB::transaction(function () use ($item, $user, $to, $fromCompartmentId, $quantity, $fromUnplaced) {
            $source = $item->placements()
                ->when($fromUnplaced, fn ($query) => $query->whereNull('compartment_id'))
                ->when(! $fromUnplaced && $fromCompartmentId !== null, fn ($query) => $query->where('compartment_id', $fromCompartmentId))
                ->lockForUpdate()
                ->first();

            if ($source === null || $source->compartment_id === $to->id) {
                return $item;
            }

            $moved = min($quantity ?? $source->quantity, $source->quantity);
            $from = $source->compartment_id;

            $this->decrement($source, $moved);
            $this->increment($item, $to->id, $moved);

            $this->record($item, $user, MovementType::Moved, $moved, $from, $to->id);

            return $this->refreshQuantity($item);
        });
    }

    public function discard(Item $item, User $user, ?string $note = null): Item
    {
        return DB::transaction(function () use ($item, $user, $note) {
            $placements = $item->placements()->get();
            $from = $placements->count() === 1 ? $placements->first()?->compartment_id : null;

            $this->record($item, $user, MovementType::Discarded, $item->quantity, fromCompartmentId: $from, note: $note);

            $item->placements()->delete();

            return $this->refreshQuantity($item);
        });
    }

    /**
     * Replace where a batch is stored (edit form). The batch keeps its history.
     *
     * @param  list<array{compartment_id: int|null, quantity: int}>  $placements
     */
    public function relocate(Item $item, User $user, array $placements): Item
    {
        $placements = $this->normalize($placements);

        return DB::transaction(function () use ($item, $user, $placements) {
            $item->placements()->delete();

            foreach ($placements as $placement) {
                $item->placements()->create($placement);
            }

            $item = $this->refreshQuantity($item);
            $item->initial_quantity = max($item->initial_quantity, $item->quantity);
            $item->save();

            $this->updated($item, $user);

            return $item;
        });
    }

    public function updated(Item $item, User $user): void
    {
        $this->record($item, $user, MovementType::Updated, null);
    }

    /**
     * Moves placements to another compartment (or to "put away" when null), merging duplicates.
     * Used when compartments or freezers disappear; it is a structural change, not a movement.
     *
     * @param  list<int>  $compartmentIds
     */
    public function rehome(array $compartmentIds, ?int $targetCompartmentId): void
    {
        if ($compartmentIds === []) {
            return;
        }

        DB::transaction(function () use ($compartmentIds, $targetCompartmentId) {
            ItemPlacement::query()
                ->whereIn('compartment_id', $compartmentIds)
                ->get()
                ->each(function (ItemPlacement $placement) use ($targetCompartmentId) {
                    $quantity = $placement->quantity;
                    $placement->delete();

                    $this->increment($placement->item, $targetCompartmentId, $quantity);
                });
        });
    }

    private function increment(Item $item, ?int $compartmentId, int $quantity): void
    {
        $placement = $item->placements()
            ->where(fn ($query) => $compartmentId === null
                ? $query->whereNull('compartment_id')
                : $query->where('compartment_id', $compartmentId))
            ->first();

        if ($placement) {
            $placement->increment('quantity', $quantity);
        } else {
            $item->placements()->create(['compartment_id' => $compartmentId, 'quantity' => $quantity]);
        }
    }

    private function decrement(ItemPlacement $placement, int $quantity): void
    {
        if ($quantity >= $placement->quantity) {
            $placement->delete();
        } else {
            $placement->decrement('quantity', $quantity);
        }
    }

    /**
     * Keep the batch total in sync with its placements, and mark it finished when empty.
     */
    private function refreshQuantity(Item $item): Item
    {
        $item->quantity = (int) $item->placements()->sum('quantity');
        $item->finished_at = $item->quantity === 0 ? ($item->finished_at ?? now()) : null;
        $item->save();
        $item->unsetRelation('placements');

        return $item;
    }

    /**
     * Merge duplicate compartments and drop empty lines.
     *
     * @param  list<array{compartment_id: int|null, quantity: int}>  $placements
     * @return Collection<int, array{compartment_id: int|null, quantity: int<1, max>}>
     */
    private function normalize(array $placements): Collection
    {
        $normalized = collect($placements)
            ->groupBy(fn (array $placement) => (string) ($placement['compartment_id'] ?? ''))
            ->map(fn (Collection $group) => [
                'compartment_id' => $group->first()['compartment_id'] ?? null,
                'quantity' => (int) $group->sum('quantity'),
            ])
            ->filter(fn (array $placement) => $placement['quantity'] > 0)
            ->values();

        if ($normalized->isEmpty()) {
            throw new InvalidArgumentException('A batch needs at least one placement.');
        }

        return $normalized;
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
