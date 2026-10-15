<?php

namespace Database\Factories;

use App\Enums\HouseholdRole;
use App\Models\Household;
use App\Models\User;
use App\Support\Palette;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Household>
 */
class HouseholdFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => 'Maison '.fake()->lastName(),
            'emoji' => fake()->randomElement(['🏠', '🏡', '🏘️', '🏔️']),
            'color' => fake()->randomElement(Palette::keys()),
            'owner_id' => User::factory(),
        ];
    }

    /**
     * Attach the owner as a member and make it their active household.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (Household $household) {
            $household->members()->syncWithoutDetaching([
                $household->owner_id => ['role' => HouseholdRole::Owner->value],
            ]);

            $owner = $household->owner;

            if ($owner->current_household_id === null) {
                $owner->switchHousehold($household);
            }
        });
    }
}
