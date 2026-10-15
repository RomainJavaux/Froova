import { GripVertical, MapPin, Plus, Sparkles, Trash2 } from 'lucide-react';
import {
    AnimatePresence,
    Reorder,
    motion,
    useDragControls,
} from 'motion/react';
import { useRef, useState } from 'react';
import { FreezerVisual } from '@/components/freezer/freezer-visual';
import InputError from '@/components/input-error';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { ColorSwatches } from '@/components/ui/pickers';
import { Stepper } from '@/components/ui/stepper';
import {
    findColor,
    findFreezerType,
    gradient,
    useCatalog,
} from '@/lib/catalog';
import { cn } from '@/lib/utils';
import type { FreezerType } from '@/types';

export type CompartmentDraft = {
    key: string;
    id?: number;
    name: string;
    itemsCount?: number;
};

export type FreezerDraft = {
    name: string;
    type: FreezerType;
    color: string;
    location: string;
    compartments: CompartmentDraft[];
};

let keySeed = 0;
export const draftKey = () =>
    `c${Date.now().toString(36)}${(keySeed++).toString(36)}`;

export function defaultCompartmentNames(
    noun: string,
    count: number,
    type: FreezerType,
): string[] {
    return Array.from({ length: count }, (_, index) =>
        type === 'chest' && count > 1 && index === count - 1
            ? 'Fond du coffre'
            : `${noun} ${index + 1}`,
    );
}

const NAME_SUGGESTIONS = [
    'Plats cuisinés',
    'Soupes',
    'Viandes',
    'Poissons',
    'Légumes',
    'Fruits',
    'Desserts',
    'Pain',
    'Glaces',
    'Bébé',
    'Sauces',
    'Divers',
];
const LOCATION_SUGGESTIONS = [
    'Cuisine',
    'Garage',
    'Cellier',
    'Cave',
    'Buanderie',
    'Sous-sol',
];

type Errors = Partial<Record<string, string>>;

/**
 * The freezer builder: type, name, color and an editable, reorderable list of compartments.
 */
export function FreezerConfigurator({
    value,
    onChange,
    errors = {},
    errorPrefix = '',
    showLocation = true,
}: {
    value: FreezerDraft;
    onChange: (value: FreezerDraft) => void;
    errors?: Errors;
    errorPrefix?: string;
    showLocation?: boolean;
}) {
    const catalog = useCatalog();
    const type = findFreezerType(catalog, value.type);
    const lastFocused = useRef<number | null>(null);

    const update = (patch: Partial<FreezerDraft>) =>
        onChange({ ...value, ...patch });

    const setType = (next: FreezerType) => {
        const nextType = findFreezerType(catalog, next);
        const untouched = value.compartments.every(
            (compartment, index) =>
                !compartment.id &&
                compartment.name ===
                    defaultCompartmentNames(
                        type.compartmentNoun,
                        value.compartments.length,
                        value.type,
                    )[index],
        );

        // Fresh configurations follow the new type's defaults; customised ones keep their names.
        const compartments = untouched
            ? defaultCompartmentNames(
                  nextType.compartmentNoun,
                  nextType.defaultCompartments,
                  next,
              ).map((name) => ({ key: draftKey(), name }))
            : value.compartments.slice(0, nextType.maxCompartments);

        update({ type: next, compartments });
    };

    const setCount = (count: number) => {
        if (count > value.compartments.length) {
            const added = Array.from(
                { length: count - value.compartments.length },
                (_, index) => ({
                    key: draftKey(),
                    name: `${type.compartmentNoun} ${value.compartments.length + index + 1}`,
                }),
            );
            update({ compartments: [...value.compartments, ...added] });
        } else {
            update({ compartments: value.compartments.slice(0, count) });
        }
    };

    const renameAt = (index: number, name: string) => {
        update({
            compartments: value.compartments.map((compartment, current) =>
                current === index ? { ...compartment, name } : compartment,
            ),
        });
    };

    const removeAt = (index: number) => {
        update({
            compartments: value.compartments.filter(
                (_, current) => current !== index,
            ),
        });
    };

    const applySuggestion = (name: string) => {
        const target =
            lastFocused.current ??
            value.compartments.findIndex((compartment) =>
                /^(Tiroir|Panier) \d+$/.test(compartment.name),
            );

        if (
            target !== null &&
            target >= 0 &&
            target < value.compartments.length
        ) {
            renameAt(target, name);
            lastFocused.current = Math.min(
                target + 1,
                value.compartments.length - 1,
            );
        }
    };

    const error = (key: string) => errors[`${errorPrefix}${key}`];
    const removedItems = (index: number) =>
        value.compartments[index]?.itemsCount ?? 0;

    return (
        <div className="space-y-9">
            {/* Type */}
            <section>
                <StepLabel step={1} title="Quel type de congélateur ?" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {catalog.freezerTypes.map((option) => {
                        const active = option.value === value.type;

                        return (
                            <motion.button
                                key={option.value}
                                type="button"
                                onClick={() => setType(option.value)}
                                whileTap={{ scale: 0.96 }}
                                whileHover={{ y: -3 }}
                                className={cn(
                                    'relative flex flex-col items-center gap-3 rounded-3xl border bg-card/80 p-4 pt-5 text-center transition-colors',
                                    active
                                        ? 'border-transparent'
                                        : 'border-border hover:border-primary/30',
                                )}
                            >
                                {active && (
                                    <motion.span
                                        layoutId="freezer-type-active"
                                        className="absolute inset-0 rounded-3xl"
                                        style={{
                                            boxShadow:
                                                '0 0 0 2.5px var(--primary), 0 16px 36px -18px var(--primary)',
                                        }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 500,
                                            damping: 36,
                                        }}
                                    />
                                )}
                                <div className="grid h-20 place-items-center">
                                    <FreezerVisual
                                        type={option.value}
                                        color={value.color}
                                        compartments={Array.from(
                                            {
                                                length: Math.min(
                                                    option.defaultCompartments,
                                                    4,
                                                ),
                                            },
                                            (_, index) => ({
                                                id: index,
                                                name: '',
                                            }),
                                        )}
                                        size="xs"
                                    />
                                </div>
                                <div>
                                    <div className="font-display font-bold">
                                        {option.label}
                                    </div>
                                    <div className="text-xs leading-snug text-muted-foreground">
                                        {option.description}
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </section>

            {/* Name & place */}
            <section>
                <StepLabel step={2} title="Comment l’appelle-t-on ?" />
                <div className="space-y-3">
                    <Input
                        value={value.name}
                        onChange={(event) =>
                            update({ name: event.target.value })
                        }
                        placeholder={`Ex. ${value.type === 'chest' ? 'Coffre du garage' : 'Congel cuisine'}`}
                        maxLength={60}
                        aria-invalid={Boolean(error('name'))}
                        className="h-14 text-lg font-semibold"
                    />
                    <InputError message={error('name')} />

                    {showLocation && (
                        <div>
                            <div className="relative">
                                <MapPin className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={value.location}
                                    onChange={(event) =>
                                        update({ location: event.target.value })
                                    }
                                    placeholder="Où se trouve-t-il ? (facultatif)"
                                    maxLength={60}
                                    className="pl-10"
                                />
                            </div>
                            <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
                                {LOCATION_SUGGESTIONS.map((location) => (
                                    <Chip
                                        key={location}
                                        className="h-8 px-3 text-xs"
                                        active={value.location === location}
                                        onClick={() => update({ location })}
                                    >
                                        {location}
                                    </Chip>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Color */}
            <section>
                <StepLabel step={3} title="Une couleur pour le reconnaître" />
                <ColorSwatches
                    colors={catalog.palette}
                    value={value.color}
                    onChange={(color) => update({ color })}
                />
            </section>

            {/* Compartments */}
            <section>
                <StepLabel
                    step={4}
                    title={`Combien de ${type.compartmentNoun.toLowerCase()}s ?`}
                />

                <div className="surface flex items-center gap-4 p-4">
                    <Stepper
                        value={value.compartments.length}
                        onChange={setCount}
                        min={1}
                        max={type.maxCompartments}
                        suffix={`${type.compartmentNoun.toLowerCase()}${value.compartments.length > 1 ? 's' : ''}`}
                        className="flex-1"
                    />
                </div>
                <InputError className="mt-2" message={error('compartments')} />

                <div className="mt-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <Sparkles className="size-3.5" /> Touche une idée pour
                        renommer le {type.compartmentNoun.toLowerCase()}{' '}
                        sélectionné
                    </div>
                    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                        {NAME_SUGGESTIONS.map((name) => (
                            <Chip
                                key={name}
                                className="h-8 px-3 text-xs"
                                onClick={() => applySuggestion(name)}
                            >
                                {name}
                            </Chip>
                        ))}
                    </div>
                </div>

                <Reorder.Group
                    axis="y"
                    values={value.compartments}
                    onReorder={(compartments) => update({ compartments })}
                    className="mt-4 space-y-2"
                >
                    <AnimatePresence initial={false}>
                        {value.compartments.map((compartment, index) => (
                            <CompartmentRow
                                key={compartment.key}
                                compartment={compartment}
                                index={index}
                                palette={gradient(
                                    findColor(catalog, value.color),
                                    160,
                                )}
                                canRemove={value.compartments.length > 1}
                                error={error(`compartments.${index}.name`)}
                                onFocus={() => {
                                    lastFocused.current = index;
                                }}
                                onRename={(name) => renameAt(index, name)}
                                onRemove={() => removeAt(index)}
                                removalWarning={removedItems(index) > 0}
                            />
                        ))}
                    </AnimatePresence>
                </Reorder.Group>

                {value.compartments.length < type.maxCompartments && (
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCount(value.compartments.length + 1)}
                        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                    >
                        <Plus className="size-4" /> Ajouter un{' '}
                        {type.compartmentNoun.toLowerCase()}
                    </motion.button>
                )}
            </section>
        </div>
    );
}

function CompartmentRow({
    compartment,
    index,
    palette,
    canRemove,
    error,
    removalWarning,
    onFocus,
    onRename,
    onRemove,
}: {
    compartment: CompartmentDraft;
    index: number;
    palette: string;
    canRemove: boolean;
    error?: string;
    removalWarning: boolean;
    onFocus: () => void;
    onRename: (name: string) => void;
    onRemove: () => void;
}) {
    const controls = useDragControls();
    const [confirming, setConfirming] = useState(false);

    return (
        <Reorder.Item
            value={compartment}
            dragListener={false}
            dragControls={controls}
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.18 } }}
            className="relative"
            whileDrag={{
                scale: 1.03,
                boxShadow: 'var(--shadow-float)',
                zIndex: 20,
            }}
        >
            <div className="surface flex items-center gap-2 rounded-2xl p-2 pl-1">
                <button
                    type="button"
                    className="grid size-9 cursor-grab touch-none place-items-center rounded-xl text-muted-foreground active:cursor-grabbing"
                    onPointerDown={(event) => controls.start(event)}
                    aria-label="Déplacer"
                >
                    <GripVertical className="size-4" />
                </button>
                <span
                    className="grid size-8 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
                    style={{ background: palette }}
                >
                    {index + 1}
                </span>
                <input
                    value={compartment.name}
                    onFocus={onFocus}
                    onChange={(event) => onRename(event.target.value)}
                    maxLength={40}
                    className="h-10 min-w-0 flex-1 rounded-xl bg-transparent px-2 text-[15px] font-semibold outline-none focus:bg-muted/60"
                    aria-label={`Nom du compartiment ${index + 1}`}
                />
                {compartment.itemsCount ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {compartment.itemsCount} art.
                    </span>
                ) : null}
                {canRemove && (
                    <button
                        type="button"
                        onClick={() =>
                            removalWarning && !confirming
                                ? setConfirming(true)
                                : onRemove()
                        }
                        className={cn(
                            'grid size-9 place-items-center rounded-xl transition',
                            confirming
                                ? 'bg-destructive text-white'
                                : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
                        )}
                        aria-label="Supprimer"
                    >
                        <Trash2 className="size-4" />
                    </button>
                )}
            </div>
            {confirming && (
                <p className="mt-1 px-3 text-xs font-medium text-destructive">
                    Ce compartiment contient des aliments : ils seront déplacés
                    dans le premier. Touche encore pour confirmer.
                </p>
            )}
            {error && <InputError className="mt-1 px-3" message={error} />}
        </Reorder.Item>
    );
}

export function StepLabel({ step, title }: { step: number; title: string }) {
    return (
        <div className="mb-3.5 flex items-center gap-3">
            <span className="grid size-7 place-items-center rounded-full bg-primary/12 text-xs font-extrabold text-primary">
                {step}
            </span>
            <h2 className="font-display text-lg font-bold">{title}</h2>
        </div>
    );
}
