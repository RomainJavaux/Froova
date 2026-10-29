<?php

namespace Database\Seeders;

use App\Actions\Freezers\SaveFreezer;
use App\Actions\Households\CreateHousehold;
use App\Enums\HouseholdRole;
use App\Enums\ItemCategory;
use App\Models\Compartment;
use App\Models\Item;
use App\Models\User;
use App\Services\Inventory;
use Illuminate\Database\Seeder;

/**
 * Local demo data: a family household with two freezers full of batch cooking.
 */
class DatabaseSeeder extends Seeder
{
    public function run(CreateHousehold $createHousehold, SaveFreezer $saveFreezer, Inventory $inventory): void
    {
        $user = User::factory()->create([
            'name' => 'Romain',
            'email' => 'test@example.com',
        ]);

        $partner = User::factory()->create([
            'name' => 'Camille',
            'email' => 'camille@example.com',
        ]);

        $household = $createHousehold->handle($user, ['name' => 'La maison', 'emoji' => '🏡', 'color' => 'frost']);
        $household->members()->attach($partner->id, ['role' => HouseholdRole::Admin->value]);
        $partner->switchHousehold($household);

        $kitchen = $saveFreezer->handle($household, [
            'name' => 'Congel cuisine',
            'type' => 'upright',
            'color' => 'frost',
            'location' => 'Cuisine',
            'compartments' => [
                ['name' => 'Plats du soir'],
                ['name' => 'Soupes'],
                ['name' => 'Viandes & poissons'],
                ['name' => 'Légumes'],
                ['name' => 'Desserts'],
            ],
        ]);

        $garage = $saveFreezer->handle($household, [
            'name' => 'Coffre garage',
            'type' => 'chest',
            'color' => 'mint',
            'location' => 'Garage',
            'compartments' => [
                ['name' => 'Panier gauche'],
                ['name' => 'Panier droit'],
                ['name' => 'Fond du coffre'],
            ],
        ]);

        $k = $kitchen->compartments->values();
        $g = $garage->compartments->values();

        $items = [
            [$k[0], 'Lasagnes bolognaise', '🍝', ItemCategory::Meal, 10, 'portion', 2, 75, 'Recette de mamie, sauce mijotée 3h.', ['viande', 'four']],
            [$k[0], 'Chili con carne', '🌶️', ItemCategory::Meal, 6, 'portion', 2, 20, 'Pas trop épicé, ok pour les enfants.', ['riz']],
            [$k[0], 'Hachis parmentier', '🥔', ItemCategory::Meal, 4, 'portion', 2, 40, null, []],
            [$k[0], 'Curry de pois chiches', '🍛', ItemCategory::Meal, 5, 'box', 1, 8, 'Végétarien, lait de coco.', ['veggie']],
            [$k[1], 'Velouté de potiron', '🎃', ItemCategory::Soup, 6, 'jar', 2, 30, null, ['veggie']],
            [$k[1], 'Soupe minestrone', '🥣', ItemCategory::Soup, 3, 'jar', 2, 95, null, []],
            [$k[1], 'Bouillon de volaille', '🫙', ItemCategory::Sauce, 8, 'cube', null, 50, 'Cubes pour les risottos.', []],
            [$k[2], 'Filets de cabillaud', '🐟', ItemCategory::Fish, 4, 'piece', 1, 110, null, []],
            [$k[2], 'Poulet rôti effiloché', '🍗', ItemCategory::Poultry, 3, 'bag', 2, 15, null, []],
            [$k[2], 'Boulettes de bœuf', '🧆', ItemCategory::Meat, 24, 'piece', null, 60, null, ['apéro']],
            [$k[3], 'Haricots verts', '🫛', ItemCategory::Vegetables, 3, 'bag', 3, 200, null, []],
            [$k[3], 'Épinards en branches', '🥬', ItemCategory::Vegetables, 2, 'bag', 3, 120, null, []],
            [$k[4], 'Cookies (pâte crue)', '🍪', ItemCategory::Dessert, 12, 'piece', null, 25, '12 min à 180°C directement du congel.', ['goûter']],
            [$k[4], 'Glace vanille maison', '🍨', ItemCategory::IceCream, 1, 'box', 6, 55, null, []],
            [$g[0], 'Pain de campagne', '🥖', ItemCategory::Bread, 2, 'piece', 4, 10, 'Tranché.', []],
            [$g[0], 'Croissants', '🥐', ItemCategory::Bread, 8, 'piece', null, 35, null, ['brunch']],
            [$g[1], 'Purée carotte-panais', '🍼', ItemCategory::Baby, 12, 'cube', null, 12, 'Pour bébé, 1 cube = 30 g.', ['bébé']],
            [$g[1], 'Framboises', '🍓', ItemCategory::Fruits, 2, 'bag', null, 240, 'Cueillies au jardin.', ['smoothie']],
            [$g[2], 'Bolognaise (sauce)', '🍅', ItemCategory::Sauce, 5, 'jar', 3, 85, null, ['viande']],
            [$g[2], 'Gratin dauphinois', '🧀', ItemCategory::Meal, 2, 'tray', 4, 100, null, ['four']],
        ];

        foreach ($items as $index => [$compartment, $name, $emoji, $category, $quantity, $unit, $servings, $daysAgo, $description, $tags]) {
            /** @var Compartment $compartment */
            $frozenOn = now()->subDays($daysAgo)->startOfDay();

            $item = new Item([
                'household_id' => $household->id,
                'name' => $name,
                'emoji' => $emoji,
                'category' => $category,
                'quantity' => $quantity,
                'unit' => $unit,
                'servings' => $servings,
                'prepared_on' => $frozenOn,
                'frozen_on' => $frozenOn,
                'best_before' => $frozenOn->addMonthsNoOverflow($category->shelfLifeMonths()),
                'description' => $description,
                'tags' => $tags,
                ...(self::PREPARATIONS[$name] ?? []),
            ]);

            // The big lasagne batch is split between the kitchen freezer and the garage chest.
            $placements = $name === 'Lasagnes bolognaise'
                ? [['compartment_id' => $compartment->id, 'quantity' => 6], ['compartment_id' => $g[2]->id, 'quantity' => $quantity - 6]]
                : [['compartment_id' => $compartment->id, 'quantity' => $quantity]];

            $inventory->add($item, $index % 3 === 0 ? $partner : $user, $placements);
        }

        $lasagnes = Item::query()->where('name', 'Lasagnes bolognaise')->firstOrFail();
        $inventory->take($lasagnes, $partner, 2, $k[0]->id);
        $inventory->take(Item::query()->where('name', 'Croissants')->firstOrFail(), $user, 4);
    }

    /**
     * How to eat a few of the demo dishes.
     */
    private const PREPARATIONS = [
        'Lasagnes bolognaise' => [
            'thaw' => 'fridge',
            'reheat_method' => 'oven',
            'reheat_temperature' => 180,
            'reheat_minutes' => 25,
            'extras' => ['Parmesan', 'Salade verte'],
            'reheat_notes' => 'Couvrir de papier alu les 15 premières minutes, puis gratiner à découvert.',
        ],
        'Curry de pois chiches' => [
            'thaw' => 'frozen',
            'reheat_method' => 'pot',
            'reheat_minutes' => 12,
            'extras' => ['Riz basmati', 'Coriandre fraîche'],
            'reheat_notes' => 'Ajouter un filet d’eau et remuer de temps en temps.',
        ],
    ];
}
