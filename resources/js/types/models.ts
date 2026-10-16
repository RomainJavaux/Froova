export type FreezerType = 'upright' | 'chest' | 'combo' | 'compact';

export type Freshness = {
    status: 'fresh' | 'soon' | 'expired' | 'unknown';
    daysLeft: number | null;
    progress: number | null;
};

export type ItemLocation = {
    freezerId: number;
    freezerName: string;
    freezerColor: string;
    freezerType: FreezerType;
    compartmentId: number;
    compartmentName: string;
    compartmentPosition: number;
    /** Part of the batch stored in this compartment. */
    quantity: number;
};

export type Item = {
    id: number;
    name: string;
    emoji: string | null;
    displayEmoji: string;
    category: string;
    description: string | null;
    photoUrl: string | null;
    quantity: number;
    initialQuantity: number;
    unit: string;
    servings: number | null;
    weightGrams: number | null;
    preparedOn: string | null;
    frozenOn: string;
    bestBefore: string | null;
    tags: string[];
    finishedAt: string | null;
    createdAt: string | null;
    freshness: Freshness;
    /** Main location (biggest part); a batch can be spread over several compartments. */
    compartmentId: number | null;
    location: ItemLocation | null;
    locations: ItemLocation[];
    /** Portions left without a compartment (its freezer was deleted). */
    unplacedQuantity: number;
    /** Quantity in the compartment the batch is listed under (freezer page). */
    hereQuantity: number | null;
    createdBy?: { id: number; name: string } | null;
};

export type Compartment = {
    id: number;
    name: string;
    color: string | null;
    position: number;
    itemsCount: number;
    units: number;
    expiringCount: number | null;
    previewEmojis: string[];
    items: Item[] | null;
};

export type Freezer = {
    id: number;
    name: string;
    type: FreezerType;
    color: string;
    location: string | null;
    notes: string | null;
    lastDefrostedOn: string | null;
    position: number;
    compartments: Compartment[];
    stats: { items: number; units: number; expiring: number };
};

export type FreezerOption = {
    id: number;
    name: string;
    type: FreezerType;
    color: string;
    location: string | null;
    compartments: {
        id: number;
        name: string;
        position: number;
        itemsCount: number;
    }[];
};

export type MovementType =
    | 'added'
    | 'taken'
    | 'restocked'
    | 'moved'
    | 'updated'
    | 'discarded';

export type Movement = {
    id: number;
    type: MovementType;
    itemId: number | null;
    itemName: string;
    itemEmoji: string | null;
    quantity: number | null;
    note: string | null;
    createdAt: string;
    user: { id: number; name: string } | null;
    from: string | null;
    to: string | null;
};

export type HouseholdRole = 'owner' | 'admin' | 'member';

export type CurrentHousehold = {
    id: number;
    name: string;
    emoji: string;
    color: string;
    role: HouseholdRole | null;
};

export type HouseholdSummary = {
    id: number;
    name: string;
    emoji: string;
    color: string;
};

export type CategoryOption = {
    value: string;
    label: string;
    emoji: string;
    color: string;
    shelfLifeMonths: number;
};

export type UnitOption = {
    value: string;
    singular: string;
    plural: string;
};

export type FreezerTypeOption = {
    value: FreezerType;
    label: string;
    description: string;
    compartmentNoun: string;
    defaultCompartments: number;
    maxCompartments: number;
};

export type PaletteColor = {
    value: string;
    label: string;
    from: string;
    to: string;
};

export type Catalog = {
    categories: CategoryOption[];
    units: UnitOption[];
    freezerTypes: FreezerTypeOption[];
    roles: { value: HouseholdRole; label: string }[];
    palette: PaletteColor[];
};
