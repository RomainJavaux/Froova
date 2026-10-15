import { usePage } from '@inertiajs/react';
import type {
    Catalog,
    CategoryOption,
    FreezerType,
    FreezerTypeOption,
    PaletteColor,
} from '@/types';

const FALLBACK_COLOR: PaletteColor = {
    value: 'frost',
    label: 'Givre',
    from: '#7dd3fc',
    to: '#6366f1',
};

export function useCatalog(): Catalog {
    return usePage().props.catalog;
}

export function findCategory(
    catalog: Catalog,
    value: string,
): CategoryOption | undefined {
    return catalog.categories.find((category) => category.value === value);
}

export function findFreezerType(
    catalog: Catalog,
    value: FreezerType,
): FreezerTypeOption {
    return (
        catalog.freezerTypes.find((type) => type.value === value) ??
        catalog.freezerTypes[0]
    );
}

export function findColor(
    catalog: Catalog,
    value?: string | null,
): PaletteColor {
    return (
        catalog.palette.find((color) => color.value === value) ??
        catalog.palette[0] ??
        FALLBACK_COLOR
    );
}

export function gradient(color: PaletteColor, angle = 135): string {
    return `linear-gradient(${angle}deg, ${color.from}, ${color.to})`;
}

/**
 * "3 portions", "1 sachet"…
 */
export function formatQuantity(
    catalog: Catalog,
    unit: string,
    quantity: number,
): string {
    const option = catalog.units.find((candidate) => candidate.value === unit);

    if (!option) {
        return String(quantity);
    }

    return `${quantity} ${quantity > 1 ? option.plural : option.singular}`;
}

export function unitWord(
    catalog: Catalog,
    unit: string,
    quantity: number,
): string {
    const option = catalog.units.find((candidate) => candidate.value === unit);

    return option ? (quantity > 1 ? option.plural : option.singular) : '';
}
