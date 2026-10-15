<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property int|null $current_household_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'current_household_id'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * @return BelongsToMany<Household, $this>
     */
    public function households(): BelongsToMany
    {
        return $this->belongsToMany(Household::class)
            ->withPivot('role')
            ->withTimestamps()
            ->orderBy('households.name');
    }

    /**
     * @return BelongsTo<Household, $this>
     */
    public function currentHousehold(): BelongsTo
    {
        return $this->belongsTo(Household::class, 'current_household_id');
    }

    /**
     * Resolve the active household, falling back to the first one the user belongs to.
     */
    public function activeHousehold(): ?Household
    {
        $current = $this->currentHousehold;

        if ($current && $current->hasMember($this)) {
            return $current;
        }

        $fallback = $this->households()->first();

        if ($fallback?->id !== $this->current_household_id) {
            $this->forceFill(['current_household_id' => $fallback?->id])->save();
            $this->setRelation('currentHousehold', $fallback);
        }

        return $fallback;
    }

    public function belongsToHousehold(int $householdId): bool
    {
        return $this->households()->whereKey($householdId)->exists();
    }

    public function switchHousehold(Household $household): void
    {
        $this->forceFill(['current_household_id' => $household->id])->save();
        $this->setRelation('currentHousehold', $household);
    }
}
