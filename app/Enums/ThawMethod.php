<?php

namespace App\Enums;

/**
 * What to do with a batch between the freezer and the pan.
 */
enum ThawMethod: string
{
    case Frozen = 'frozen';
    case Fridge = 'fridge';
    case Room = 'room';
    case Microwave = 'microwave';

    public function label(): string
    {
        return match ($this) {
            self::Frozen => 'Sans décongeler',
            self::Fridge => 'Veille au frigo',
            self::Room => 'Temp. ambiante',
            self::Microwave => 'Micro-ondes',
        };
    }
}
