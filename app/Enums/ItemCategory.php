<?php

namespace App\Enums;

enum ItemCategory: string
{
    case Meal = 'meal';
    case Soup = 'soup';
    case Sauce = 'sauce';
    case Meat = 'meat';
    case Poultry = 'poultry';
    case Fish = 'fish';
    case Vegetables = 'vegetables';
    case Fruits = 'fruits';
    case Starch = 'starch';
    case Bread = 'bread';
    case Dessert = 'dessert';
    case IceCream = 'icecream';
    case Herbs = 'herbs';
    case Baby = 'baby';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Meal => 'Plats cuisinés',
            self::Soup => 'Soupes & veloutés',
            self::Sauce => 'Sauces & bouillons',
            self::Meat => 'Viandes',
            self::Poultry => 'Volailles',
            self::Fish => 'Poissons & fruits de mer',
            self::Vegetables => 'Légumes',
            self::Fruits => 'Fruits',
            self::Starch => 'Pâtes, riz & féculents',
            self::Bread => 'Pains & viennoiseries',
            self::Dessert => 'Desserts & pâtisseries',
            self::IceCream => 'Glaces & sorbets',
            self::Herbs => 'Herbes & aromates',
            self::Baby => 'Repas bébé',
            self::Other => 'Autre',
        };
    }

    public function emoji(): string
    {
        return match ($this) {
            self::Meal => '🍲',
            self::Soup => '🥣',
            self::Sauce => '🫙',
            self::Meat => '🥩',
            self::Poultry => '🍗',
            self::Fish => '🐟',
            self::Vegetables => '🥦',
            self::Fruits => '🍓',
            self::Starch => '🍝',
            self::Bread => '🥐',
            self::Dessert => '🍰',
            self::IceCream => '🍨',
            self::Herbs => '🌿',
            self::Baby => '🍼',
            self::Other => '📦',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Meal => '#f97316',
            self::Soup => '#f59e0b',
            self::Sauce => '#ef4444',
            self::Meat => '#e11d48',
            self::Poultry => '#eab308',
            self::Fish => '#0ea5e9',
            self::Vegetables => '#22c55e',
            self::Fruits => '#ec4899',
            self::Starch => '#d97706',
            self::Bread => '#a16207',
            self::Dessert => '#c026d3',
            self::IceCream => '#8b5cf6',
            self::Herbs => '#10b981',
            self::Baby => '#14b8a6',
            self::Other => '#64748b',
        };
    }

    /**
     * Recommended storage duration in the freezer, in months.
     */
    public function shelfLifeMonths(): int
    {
        return match ($this) {
            self::Meal, self::Soup, self::Starch, self::Bread, self::Dessert => 3,
            self::Sauce, self::Fish, self::Other => 4,
            self::Meat, self::Poultry, self::Herbs => 6,
            self::Vegetables, self::Fruits => 10,
            self::IceCream => 2,
            self::Baby => 1,
        };
    }
}
