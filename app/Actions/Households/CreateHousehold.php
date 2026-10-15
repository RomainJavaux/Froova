<?php

namespace App\Actions\Households;

use App\Enums\HouseholdRole;
use App\Models\Household;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreateHousehold
{
    /**
     * @param  array{name: string, emoji?: string|null, color?: string|null}  $attributes
     */
    public function handle(User $owner, array $attributes): Household
    {
        return DB::transaction(function () use ($owner, $attributes) {
            $household = Household::query()->create([
                'name' => $attributes['name'],
                'emoji' => $attributes['emoji'] ?? '🏠',
                'color' => $attributes['color'] ?? 'frost',
                'owner_id' => $owner->id,
            ]);

            $household->members()->attach($owner->id, ['role' => HouseholdRole::Owner->value]);

            $owner->switchHousehold($household);

            return $household;
        });
    }
}
