export type PlacementDraft = {
    compartment_id: number;
    quantity: number;
};

export const totalOf = (placements: PlacementDraft[]): number =>
    placements.reduce((sum, placement) => sum + placement.quantity, 0);

/**
 * Add a compartment (it takes half of the biggest share) or remove it (its share goes back
 * to the first remaining compartment). The total only grows when there is nothing left to split.
 */
export function togglePlacement(
    placements: PlacementDraft[],
    compartmentId: number,
    total: number,
): PlacementDraft[] {
    const existing = placements.find(
        (placement) => placement.compartment_id === compartmentId,
    );

    if (existing) {
        const rest = placements.filter((placement) => placement !== existing);

        return rest.map((placement, index) =>
            index === 0
                ? {
                      ...placement,
                      quantity: placement.quantity + existing.quantity,
                  }
                : placement,
        );
    }

    if (placements.length === 0) {
        return [
            { compartment_id: compartmentId, quantity: Math.max(1, total) },
        ];
    }

    const biggest = placements.reduce(
        (max, placement, index) =>
            placement.quantity > placements[max].quantity ? index : max,
        0,
    );
    const share = Math.floor(placements[biggest].quantity / 2);

    if (share < 1) {
        return [...placements, { compartment_id: compartmentId, quantity: 1 }];
    }

    return [
        ...placements.map((placement, index) =>
            index === biggest
                ? { ...placement, quantity: placement.quantity - share }
                : placement,
        ),
        { compartment_id: compartmentId, quantity: share },
    ];
}

/**
 * Change the total: a single compartment simply follows it; with several, the difference
 * goes to (or comes from) the last ones, keeping at least one portion per compartment.
 */
export function withTotal(
    placements: PlacementDraft[],
    total: number,
): PlacementDraft[] {
    if (placements.length <= 1) {
        return placements.map((placement) => ({
            ...placement,
            quantity: total,
        }));
    }

    const next = placements.map((placement) => ({ ...placement }));
    let delta = total - totalOf(next);

    if (delta > 0) {
        next[next.length - 1].quantity += delta;

        return next;
    }

    for (let index = next.length - 1; index >= 0 && delta < 0; index--) {
        const removable = Math.min(next[index].quantity - 1, -delta);
        next[index].quantity -= removable;
        delta += removable;
    }

    return next;
}
