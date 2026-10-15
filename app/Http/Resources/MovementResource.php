<?php

namespace App\Http\Resources;

use App\Models\ItemMovement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ItemMovement
 */
class MovementResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'itemId' => $this->item_id,
            'itemName' => $this->item_name,
            'itemEmoji' => $this->item_emoji,
            'quantity' => $this->quantity,
            'note' => $this->note,
            'createdAt' => $this->created_at->toIso8601String(),
            'user' => $this->user ? ['id' => $this->user->id, 'name' => $this->user->name] : null,
            'from' => $this->fromCompartment?->name,
            'to' => $this->toCompartment?->name,
        ];
    }
}
