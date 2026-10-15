<?php

namespace App\Http\Resources;

use App\Models\Item;
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
        $compartment = $this->relationLoaded('compartment') ? $this->compartment : null;
        $freezer = $compartment?->relationLoaded('freezer') ? $compartment->freezer : null;

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
            'compartmentId' => $this->compartment_id,
            'location' => $compartment && $freezer ? [
                'freezerId' => $freezer->id,
                'freezerName' => $freezer->name,
                'freezerColor' => $freezer->color,
                'freezerType' => $freezer->type->value,
                'compartmentId' => $compartment->id,
                'compartmentName' => $compartment->name,
                'compartmentPosition' => $compartment->position,
            ] : null,
            'createdBy' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ] : null),
        ];
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
