<?php

namespace App\Enums;

enum ReheatMethod: string
{
    case Oven = 'oven';
    case Microwave = 'microwave';
    case Pot = 'pot';
    case Pan = 'pan';
    case Steam = 'steam';
    case AirFryer = 'airfryer';
    case Cold = 'cold';

    public function label(): string
    {
        return match ($this) {
            self::Oven => 'Four',
            self::Microwave => 'Micro-ondes',
            self::Pot => 'Casserole',
            self::Pan => 'Poêle',
            self::Steam => 'Vapeur',
            self::AirFryer => 'Air fryer',
            self::Cold => 'Se mange froid',
        };
    }

    /**
     * Whether a temperature makes sense for this method.
     */
    public function usesTemperature(): bool
    {
        return in_array($this, [self::Oven, self::AirFryer], true);
    }
}
