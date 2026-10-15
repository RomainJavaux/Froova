<?php

namespace Database\Factories;

use App\Enums\ItemCategory;
use App\Enums\ItemUnit;
use App\Models\Household;
use App\Models\Item;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Item>
 */
class ItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $category = fake()->randomElement(ItemCategory::cases());
        $quantity = fake()->numberBetween(1, 10);
        $frozenOn = now()->subDays(fake()->numberBetween(0, 90));

        return [
            'household_id' => Household::factory(),
            'name' => fake()->randomElement(['Lasagnes', 'Bolognaise', 'Soupe de potiron', 'Chili con carne', 'Gratin dauphinois']),
            'category' => $category,
            'quantity' => $quantity,
            'initial_quantity' => $quantity,
            'unit' => ItemUnit::Portion,
            'servings' => fake()->optional()->numberBetween(1, 4),
            'prepared_on' => $frozenOn,
            'frozen_on' => $frozenOn,
            'best_before' => $frozenOn->addMonths($category->shelfLifeMonths()),
        ];
    }
}
