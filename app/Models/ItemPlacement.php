<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * The part of a batch stored in one compartment.
 *
 * @property int $id
 * @property int $item_id
 * @property int|null $compartment_id
 * @property int $quantity
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['item_id', 'compartment_id', 'quantity'])]
class ItemPlacement extends Model
{
    /**
     * @return BelongsTo<Item, $this>
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * @return BelongsTo<Compartment, $this>
     */
    public function compartment(): BelongsTo
    {
        return $this->belongsTo(Compartment::class);
    }
}
