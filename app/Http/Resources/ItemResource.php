<?php

namespace App\Http\Resources;

use App\Models\Item;
use App\Models\ItemPlacement;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Item
 */
class ItemResource extends JsonResource
{
    /**
     * Days before the best-before date when an item is flagged "to eat soon".
     */
    public const SOON_THRESHOLD_DAYS = 14;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locations = $this->locations();
        $pivot = $this->resource->getRelationValue('pivot');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'emoji' => $this->emoji,
            'displayEmoji' => $this->displayEmoji(),
            'category' => $this->category->value,
            'description' => $this->description,
            'photoUrl' => $this->photoUrl(),
            'quantity' => $this->quantity,
            'initialQuantity' => $this->initial_quantity,
            'unit' => $this->unit->value,
            'servings' => $this->servings,
            'weightGrams' => $this->weight_grams,
            'preparedOn' => $this->prepared_on?->toDateString(),
            'frozenOn' => $this->frozen_on->toDateString(),
            'bestBefore' => $this->best_before?->toDateString(),
            'tags' => $this->tags ?? [],
            'finishedAt' => $this->finished_at?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),
            'freshness' => $this->freshness(),
            // Main location (biggest part) first; a batch can be spread over several compartments.
            'compartmentId' => $locations[0]['compartmentId'] ?? null,
            'location' => $locations[0] ?? null,
            'locations' => $locations,
            'unplacedQuantity' => $this->relationLoaded('placements')
                ? (int) $this->placements->whereNull('compartment_id')->sum('quantity')
                : 0,
            // Quantity in the compartment this batch was loaded from (freezer page).
            'hereQuantity' => $pivot instanceof Pivot ? (int) $pivot->getAttribute('quantity') : null,
            'createdBy' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ] : null),
        ];
    }

    /**
     * @return list<array{freezerId: int, freezerName: string, freezerColor: string, freezerType: string, compartmentId: int, compartmentName: string, compartmentPosition: int, quantity: int}>
     */
    private function locations(): array
    {
        if (! $this->relationLoaded('placements')) {
            return [];
        }

        return array_values($this->placements
            ->filter(fn (ItemPlacement $placement) => $placement->compartment?->relationLoaded('freezer') && $placement->compartment->freezer)
            ->map(fn (ItemPlacement $placement) => [
                'freezerId' => $placement->compartment->freezer->id,
                'freezerName' => $placement->compartment->freezer->name,
                'freezerColor' => $placement->compartment->freezer->color,
                'freezerType' => $placement->compartment->freezer->type->value,
                'compartmentId' => $placement->compartment->id,
                'compartmentName' => $placement->compartment->name,
                'compartmentPosition' => $placement->compartment->position,
                'quantity' => $placement->quantity,
            ])
            ->all());
    }

    /**
     * @return array{status: string, daysLeft: int|null, progress: float|null}
     */
    private function freshness(): array
    {
        if ($this->best_before === null) {
            return ['status' => 'unknown', 'daysLeft' => null, 'progress' => null];
        }

        $today = now()->startOfDay();
        $daysLeft = (int) $today->diffInDays($this->best_before->startOfDay(), false);
        $total = max(1, (int) $this->frozen_on->startOfDay()->diffInDays($this->best_before->startOfDay(), false));
        $elapsed = (int) $this->frozen_on->startOfDay()->diffInDays($today, false);

        return [
            'status' => match (true) {
                $daysLeft < 0 => 'expired',
                $daysLeft <= self::SOON_THRESHOLD_DAYS => 'soon',
                default => 'fresh',
            },
            'daysLeft' => $daysLeft,
            'progress' => round(min(1, max(0, $elapsed / $total)), 3),
        ];
    }
}
