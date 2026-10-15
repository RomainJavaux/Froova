<?php

namespace App\Models;

use App\Enums\ItemCategory;
use App\Enums\ItemUnit;
use Database\Factories\ItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int $household_id
 * @property int|null $compartment_id
 * @property int|null $created_by
 * @property string $name
 * @property string|null $emoji
 * @property ItemCategory $category
 * @property string|null $description
 * @property string|null $photo_path
 * @property int $quantity
 * @property int $initial_quantity
 * @property ItemUnit $unit
 * @property int|null $servings
 * @property int|null $weight_grams
 * @property Carbon|null $prepared_on
 * @property Carbon $frozen_on
 * @property Carbon|null $best_before
 * @property list<string>|null $tags
 * @property Carbon|null $finished_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'household_id', 'compartment_id', 'created_by', 'name', 'emoji', 'category', 'description',
    'photo_path', 'quantity', 'initial_quantity', 'unit', 'servings', 'weight_grams',
    'prepared_on', 'frozen_on', 'best_before', 'tags', 'finished_at',
])]
class Item extends Model
{
    /** @use HasFactory<ItemFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'category' => ItemCategory::class,
            'unit' => ItemUnit::class,
            'prepared_on' => 'date',
            'frozen_on' => 'date',
            'best_before' => 'date',
            'tags' => 'array',
            'finished_at' => 'datetime',
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
     * @return BelongsTo<Compartment, $this>
     */
    public function compartment(): BelongsTo
    {
        return $this->belongsTo(Compartment::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return HasMany<ItemMovement, $this>
     */
    public function movements(): HasMany
    {
        return $this->hasMany(ItemMovement::class)->latest('id');
    }

    /**
     * @param  Builder<Item>  $query
     */
    public function scopeInStock(Builder $query): void
    {
        $query->whereNull('finished_at')->where('quantity', '>', 0);
    }

    /**
     * @param  Builder<Item>  $query
     */
    public function scopeFinished(Builder $query): void
    {
        $query->whereNotNull('finished_at');
    }

    public function photoUrl(): ?string
    {
        return $this->photo_path ? Storage::disk('public')->url($this->photo_path) : null;
    }

    public function displayEmoji(): string
    {
        return $this->emoji ?: $this->category->emoji();
    }
}
