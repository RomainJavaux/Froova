<?php

namespace App\Enums;

enum ItemUnit: string
{
    case Portion = 'portion';
    case Box = 'box';
    case Bag = 'bag';
    case Jar = 'jar';
    case Tray = 'tray';
    case Piece = 'piece';
    case Cube = 'cube';

    public function singular(): string
    {
        return match ($this) {
            self::Portion => 'portion',
            self::Box => 'boîte',
            self::Bag => 'sachet',
            self::Jar => 'pot',
            self::Tray => 'barquette',
            self::Piece => 'pièce',
            self::Cube => 'cube',
        };
    }

    public function plural(): string
    {
        return match ($this) {
            self::Portion => 'portions',
            self::Box => 'boîtes',
            self::Bag => 'sachets',
            self::Jar => 'pots',
            self::Tray => 'barquettes',
            self::Piece => 'pièces',
            self::Cube => 'cubes',
        };
    }

    public function format(int $quantity): string
    {
        return $quantity.' '.($quantity > 1 ? $this->plural() : $this->singular());
    }
}
