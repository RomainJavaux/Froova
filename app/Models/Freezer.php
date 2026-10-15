<?php

namespace App\Models;

use App\Enums\FreezerType;
use Database\Factories\FreezerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $household_id
 * @property string $name
 * @property FreezerType $type
 * @property string $color
 * @property string|null $location
 * @property string|null $notes
 * @property Carbon|null $last_defrosted_on
 * @property int $position
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['household_id', 'name', 'type', 'color', 'location', 'notes', 'last_defrosted_on', 'position'])]
class Freezer extends Model
{
    /** @use HasFactory<FreezerFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => FreezerType::class,
            'last_defrosted_on' => 'date',
        ];
    }

    /**
     * @return BelongsTo<Household, $this>
     */
    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    /**
     * @return HasMany<Compartment, $this>
     */
    public function compartments(): HasMany
    {
        return $this->hasMany(Compartment::class)->orderBy('position')->orderBy('id');
    }

    /**
     * @return HasManyThrough<Item, Compartment, $this>
     */
    public function items(): HasManyThrough
    {
        return $this->hasManyThrough(Item::class, Compartment::class);
    }
}
