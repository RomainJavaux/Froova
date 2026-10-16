<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $freezer_id
 * @property string $name
 * @property string|null $color
 * @property int $position
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['freezer_id', 'name', 'color', 'position'])]
class Compartment extends Model
{
    /**
     * @return BelongsTo<Freezer, $this>
     */
    public function freezer(): BelongsTo
    {
        return $this->belongsTo(Freezer::class);
    }

    /**
     * @return HasMany<ItemPlacement, $this>
     */
    public function placements(): HasMany
    {
        return $this->hasMany(ItemPlacement::class);
    }

    /**
     * Batches with a part stored here; the pivot holds the quantity in this compartment.
     *
     * @return BelongsToMany<Item, $this>
     */
    public function items(): BelongsToMany
    {
        return $this->belongsToMany(Item::class, 'item_placements')
            ->withPivot('id', 'quantity');
    }
}
