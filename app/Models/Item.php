<?php

namespace App\Models;

use App\Enums\ItemCategory;
use App\Enums\ItemUnit;
use Carbon\CarbonImmutable;
use Database\Factories\ItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int $household_id
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
 * @property CarbonImmutable|null $prepared_on
 * @property CarbonImmutable $frozen_on
 * @property CarbonImmutable|null $best_before
 * @property list<string>|null $tags
 * @property CarbonImmutable|null $finished_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable([
    'household_id', 'created_by', 'name', 'emoji', 'category', 'description',
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
     * Where the batch is stored: one placement per compartment, each with part of the quantity.
     *
     * @return HasMany<ItemPlacement, $this>
     */
    public function placements(): HasMany
    {
        return $this->hasMany(ItemPlacement::class)->orderByDesc('quantity')->orderBy('id');
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
        // Qualified: the placements pivot also has a quantity column.
        $query->whereNull($query->qualifyColumn('finished_at'))->where($query->qualifyColumn('quantity'), '>', 0);
    }

    /**
     * @param  Builder<Item>  $query
     */
    public function scopeFinished(Builder $query): void
    {
        $query->whereNotNull($query->qualifyColumn('finished_at'));
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
