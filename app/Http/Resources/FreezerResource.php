<?php

namespace App\Http\Resources;

use App\Models\Compartment;
use App\Models\Freezer;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
                'itemsCount' => $items?->count() ?? (int) ($compartment->getAttribute('items_count') ?? 0),
                'units' => (int) ($items?->sum('quantity') ?? $compartment->getAttribute('items_sum_quantity') ?? 0),
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
            'stats' => [
                'items' => $compartmentData->sum('itemsCount'),
                'units' => $compartmentData->sum('units'),
                'expiring' => $compartmentData->sum(fn (array $compartment) => $compartment['expiringCount'] ?? 0),
            ],
        ];
    }
}
