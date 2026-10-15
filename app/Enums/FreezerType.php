<?php

namespace App\Enums;

enum FreezerType: string
{
    case Upright = 'upright';
    case Chest = 'chest';
    case Combo = 'combo';
    case Compact = 'compact';

    public function label(): string
    {
        return match ($this) {
            self::Upright => 'Armoire',
            self::Chest => 'Coffre',
            self::Combo => 'Combiné',
            self::Compact => 'Compact',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Upright => 'Congélateur vertical à tiroirs',
            self::Chest => 'Congélateur bahut avec paniers',
            self::Combo => 'Partie congélateur d’un frigo combiné',
            self::Compact => 'Petit congélateur top ou sous plan',
        };
    }

    /**
     * The word used for one compartment of this kind of freezer.
     */
    public function compartmentNoun(): string
    {
        return match ($this) {
            self::Chest => 'Panier',
            default => 'Tiroir',
        };
    }

    public function defaultCompartments(): int
    {
        return match ($this) {
            self::Upright => 5,
            self::Chest => 3,
            self::Combo => 3,
            self::Compact => 3,
        };
    }

    public function maxCompartments(): int
    {
        return match ($this) {
            self::Upright => 12,
            self::Chest => 8,
            self::Combo => 6,
            self::Compact => 5,
        };
    }
}
