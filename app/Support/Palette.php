<?php

namespace App\Support;

/**
 * Soft gradient colors used to personalise households and freezers.
 */
final class Palette
{
    /**
     * @var array<string, array{label: string, from: string, to: string}>
     */
    public const COLORS = [
        'frost' => ['label' => 'Givre', 'from' => '#7dd3fc', 'to' => '#6366f1'],
        'mint' => ['label' => 'Menthe', 'from' => '#6ee7b7', 'to' => '#14b8a6'],
        'lilac' => ['label' => 'Lilas', 'from' => '#d8b4fe', 'to' => '#8b5cf6'],
        'peach' => ['label' => 'Pêche', 'from' => '#fdba74', 'to' => '#f43f5e'],
        'sun' => ['label' => 'Soleil', 'from' => '#fde047', 'to' => '#f97316'],
        'rose' => ['label' => 'Rose', 'from' => '#f9a8d4', 'to' => '#db2777'],
        'ocean' => ['label' => 'Océan', 'from' => '#67e8f9', 'to' => '#2563eb'],
        'graphite' => ['label' => 'Graphite', 'from' => '#cbd5e1', 'to' => '#475569'],
    ];

    /**
     * @return list<string>
     */
    public static function keys(): array
    {
        return array_keys(self::COLORS);
    }
}
