import {
    CloudFog,
    CookingPot,
    Fan,
    Flame,
    Microwave,
    Refrigerator,
    Salad,
    Snowflake,
    Soup,
    ThermometerSun,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Catalog, Item } from '@/types';

export type Preparation = Pick<
    Item,
    | 'thaw'
    | 'reheatMethod'
    | 'reheatMinutes'
    | 'reheatTemperature'
    | 'extras'
    | 'reheatNotes'
>;

/**
 * Form fields, named like the request (numbers stay strings while typed).
 */
export type PreparationDraft = {
    thaw: string;
    reheat_method: string;
    reheat_minutes: string;
    reheat_temperature: string;
    extras: string[];
    reheat_notes: string;
};

export const THAW_ICONS: Record<string, LucideIcon> = {
    frozen: Snowflake,
    fridge: Refrigerator,
    room: ThermometerSun,
    microwave: Microwave,
};

export const REHEAT_ICONS: Record<string, LucideIcon> = {
    oven: Flame,
    microwave: Microwave,
    pot: Soup,
    pan: CookingPot,
    steam: CloudFog,
    airfryer: Fan,
    cold: Salad,
};

export function preparationDraft(
    source?: Partial<Preparation> | null,
): PreparationDraft {
    return {
        thaw: source?.thaw ?? '',
        reheat_method: source?.reheatMethod ?? '',
        reheat_minutes: source?.reheatMinutes
            ? String(source.reheatMinutes)
            : '',
        reheat_temperature: source?.reheatTemperature
            ? String(source.reheatTemperature)
            : '',
        extras: source?.extras ?? [],
        reheat_notes: source?.reheatNotes ?? '',
    };
}

export function usesTemperature(catalog: Catalog, method: string | null) {
    return (
        catalog.reheatMethods.find((option) => option.value === method)
            ?.usesTemperature ?? false
    );
}

export function hasPreparation(preparation: Preparation): boolean {
    return Boolean(
        preparation.thaw ||
        preparation.reheatMethod ||
        preparation.reheatMinutes ||
        preparation.extras.length > 0 ||
        preparation.reheatNotes,
    );
}

export function formatMinutes(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }

    const rest = minutes % 60;

    return `${Math.floor(minutes / 60)} h${rest ? ` ${String(rest).padStart(2, '0')}` : ''}`;
}

/**
 * One line such as "Four · 180 °C · 25 min".
 */
export function reheatSummary(
    catalog: Catalog,
    preparation: Preparation,
): string | null {
    const method = catalog.reheatMethods.find(
        (option) => option.value === preparation.reheatMethod,
    );

    const parts = [
        method?.label,
        method?.usesTemperature && preparation.reheatTemperature
            ? `${preparation.reheatTemperature} °C`
            : null,
        preparation.reheatMinutes
            ? formatMinutes(preparation.reheatMinutes)
            : null,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(' · ') : null;
}
