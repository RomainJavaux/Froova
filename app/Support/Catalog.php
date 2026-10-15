<?php

namespace App\Support;

use App\Enums\FreezerType;
use App\Enums\HouseholdRole;
use App\Enums\ItemCategory;
use App\Enums\ItemUnit;

/**
 * Static reference data shared once with the frontend.
 */
final class Catalog
{
    /**
     * @return array<string, mixed>
     */
    public static function toArray(): array
    {
        return [
            'categories' => array_map(fn (ItemCategory $category) => [
                'value' => $category->value,
                'label' => $category->label(),
                'emoji' => $category->emoji(),
                'color' => $category->color(),
                'shelfLifeMonths' => $category->shelfLifeMonths(),
            ], ItemCategory::cases()),

            'units' => array_map(fn (ItemUnit $unit) => [
                'value' => $unit->value,
                'singular' => $unit->singular(),
                'plural' => $unit->plural(),
            ], ItemUnit::cases()),

            'freezerTypes' => array_map(fn (FreezerType $type) => [
                'value' => $type->value,
                'label' => $type->label(),
                'description' => $type->description(),
                'compartmentNoun' => $type->compartmentNoun(),
                'defaultCompartments' => $type->defaultCompartments(),
                'maxCompartments' => $type->maxCompartments(),
            ], FreezerType::cases()),

            'roles' => array_map(fn (HouseholdRole $role) => [
                'value' => $role->value,
                'label' => $role->label(),
            ], HouseholdRole::cases()),

            'palette' => collect(Palette::COLORS)
                ->map(fn (array $color, string $key) => ['value' => $key, ...$color])
                ->values()
                ->all(),
        ];
    }
}
