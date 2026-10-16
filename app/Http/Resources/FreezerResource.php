<?php

namespace App\Http\Resources;

use App\Models\Compartment;
use App\Models\Freezer;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

/**
 * @mixin Freezer
 */
class FreezerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $compartments = $this->relationLoaded('compartments') ? $this->compartments : collect();

        $compartmentData = $compartments->map(function (Compartment $compartment) use ($request) {
            $items = $compartment->relationLoaded('items') ? $compartment->items : null;

            return [
                'id' => $compartment->id,
                'name' => $compartment->name,
                'color' => $compartment->color,
                'position' => $compartment->position,
                'itemsCount' => $items?->count() ?? (int) ($compartment->getAttribute('placements_count') ?? 0),
                // Only the part of each batch stored in this compartment counts here.
                'units' => (int) ($items?->sum(fn (Item $item) => (int) $item->getRelationValue('pivot')?->getAttribute('quantity'))
                    ?? $compartment->getAttribute('placements_sum_quantity') ?? 0),
                'expiringCount' => $items
                    ? $items->filter(fn (Item $item) => $item->best_before !== null
                        && $item->best_before->lte(now()->addDays(ItemResource::SOON_THRESHOLD_DAYS)))->count()
                    : null,
                'previewEmojis' => $items?->take(4)->map(fn (Item $item) => $item->displayEmoji())->values()->all() ?? [],
                'items' => $items !== null
                    ? ItemResource::collection($items)->resolve($request)
                    : null,
            ];
        })->values();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type->value,
            'color' => $this->color,
            'location' => $this->location,
            'notes' => $this->notes,
            'lastDefrostedOn' => $this->last_defrosted_on?->toDateString(),
            'position' => $this->position,
            'compartments' => $compartmentData->all(),
            'stats' => $this->stats($compartments, (int) $compartmentData->sum('itemsCount'), (int) $compartmentData->sum('units')),
        ];
    }

    /**
     * A batch spread over several drawers still counts once for the whole freezer.
     *
     * @param  Collection<int, Compartment>  $compartments
     * @return array{items: int, units: int, expiring: int}
     */
    private function stats(Collection $compartments, int $placementsCount, int $units): array
    {
        if ($compartments->isEmpty() || ! $compartments->every(fn (Compartment $compartment) => $compartment->relationLoaded('items'))) {
            return [
                'items' => $placementsCount,
                'units' => $units,
                'expiring' => 0,
            ];
        }

        $items = $compartments->flatMap(fn (Compartment $compartment) => $compartment->items)->unique('id');

        return [
            'items' => $items->count(),
            'units' => $units,
            'expiring' => $items->filter(fn (Item $item) => $item->best_before !== null
                && $item->best_before->lte(now()->addDays(ItemResource::SOON_THRESHOLD_DAYS)))->count(),
        ];
    }
}
