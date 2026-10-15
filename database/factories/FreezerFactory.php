<?php

namespace Database\Factories;

use App\Enums\FreezerType;
use App\Models\Freezer;
use App\Models\Household;
use App\Support\Palette;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Freezer>
 */
class FreezerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'household_id' => Household::factory(),
            'name' => fake()->randomElement(['Congel cuisine', 'Congel garage', 'Coffre cellier']),
            'type' => FreezerType::Upright,
            'color' => fake()->randomElement(Palette::keys()),
            'location' => fake()->randomElement(['Cuisine', 'Garage', 'Cellier', null]),
        ];
    }

    /**
     * Create the given number of compartments for the freezer.
     */
    public function withCompartments(int $count = 3): static
    {
        return $this->afterCreating(function (Freezer $freezer) use ($count) {
            $noun = $freezer->type->compartmentNoun();

            foreach (range(1, $count) as $position) {
                $freezer->compartments()->create([
                    'name' => "{$noun} {$position}",
                    'position' => $position,
                ]);
            }
        });
    }
}
