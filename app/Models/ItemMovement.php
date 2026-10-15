<?php

namespace App\Models;

use App\Enums\MovementType;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $household_id
 * @property int|null $item_id
 * @property int|null $user_id
 * @property MovementType $type
 * @property string $item_name
 * @property string|null $item_emoji
 * @property int|null $quantity
 * @property int|null $from_compartment_id
 * @property int|null $to_compartment_id
 * @property string|null $note
 * @property CarbonImmutable $created_at
 */
#[Fillable([
    'household_id', 'item_id', 'user_id', 'type', 'item_name', 'item_emoji', 'quantity',
    'from_compartment_id', 'to_compartment_id', 'note',
])]
class ItemMovement extends Model
{
    public const UPDATED_AT = null;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => MovementType::class,
            'created_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Item, $this>
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Compartment, $this>
     */
    public function fromCompartment(): BelongsTo
    {
        return $this->belongsTo(Compartment::class, 'from_compartment_id');
    }

    /**
     * @return BelongsTo<Compartment, $this>
     */
    public function toCompartment(): BelongsTo
    {
        return $this->belongsTo(Compartment::class, 'to_compartment_id');
    }
}
