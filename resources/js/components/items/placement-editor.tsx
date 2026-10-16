import { Minus, Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { LocationPicker } from '@/components/items/location-picker';
import { RollingNumber } from '@/components/ui/animated-number';
import { findColor, formatQuantity, gradient, useCatalog } from '@/lib/catalog';
import { togglePlacement, totalOf } from '@/lib/placements';
import type { PlacementDraft } from '@/lib/placements';
import type { FreezerOption } from '@/types';

/**
 * Choose one or several drawers for a batch and split its quantity between them.
 */
export function PlacementEditor({
    freezers,
    placements,
    total,
    unit,
    onChange,
    error,
}: {
    freezers: FreezerOption[];
    placements: PlacementDraft[];
    /** Quantity to place when the first drawer is picked. */
    total: number;
    unit: string;
    onChange: (placements: PlacementDraft[]) => void;
    error?: string;
}) {
    const catalog = useCatalog();
    const split = placements.length > 1;

    const compartments = freezers.flatMap((freezer) =>
        freezer.compartments.map((compartment) => ({
            ...compartment,
            freezer,
        })),
    );

    const badges = split
        ? Object.fromEntries(
              placements.map((placement) => [
                  String(placement.compartment_id),
                  `×${placement.quantity}`,
              ]),
          )
        : undefined;

    const setQuantity = (compartmentId: number, quantity: number) =>
        onChange(
            placements.map((placement) =>
                placement.compartment_id === compartmentId
                    ? {
                          ...placement,
                          quantity: Math.min(999, Math.max(1, quantity)),
                      }
                    : placement,
            ),
        );

    return (
        <div>
            <LocationPicker
                freezers={freezers}
                selectedIds={placements.map(
                    (placement) => placement.compartment_id,
                )}
                badges={badges}
                onToggle={(id) =>
                    onChange(togglePlacement(placements, id, total))
                }
                error={error}
            />

            <AnimatePresence initial={false}>
                {split && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="mt-4 mb-2 text-sm font-semibold">
                            Répartition
                        </p>
                        <ul className="space-y-2">
                            <AnimatePresence initial={false}>
                                {placements.map((placement) => {
                                    const compartment = compartments.find(
                                        (candidate) =>
                                            candidate.id ===
                                            placement.compartment_id,
                                    );

                                    if (!compartment) {
                                        return null;
                                    }

                                    return (
                                        <motion.li
                                            key={placement.compartment_id}
                                            layout
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="flex items-center gap-2 rounded-2xl bg-muted/70 p-2 pl-3"
                                        >
                                            <span
                                                className="size-3 shrink-0 rounded-full"
                                                style={{
                                                    background: gradient(
                                                        findColor(
                                                            catalog,
                                                            compartment.freezer
                                                                .color,
                                                        ),
                                                    ),
                                                }}
                                            />
                                            <span className="min-w-0 flex-1 text-sm">
                                                <span className="block truncate font-semibold">
                                                    {compartment.name}
                                                </span>
                                                <span className="block truncate text-xs text-muted-foreground">
                                                    {compartment.freezer.name}
                                                </span>
                                            </span>
                                            <SmallStepper
                                                value={placement.quantity}
                                                onChange={(value) =>
                                                    setQuantity(
                                                        placement.compartment_id,
                                                        value,
                                                    )
                                                }
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onChange(
                                                        togglePlacement(
                                                            placements,
                                                            placement.compartment_id,
                                                            total,
                                                        ),
                                                    )
                                                }
                                                className="grid size-8 place-items-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                                aria-label={`Retirer ${compartment.name}`}
                                            >
                                                <X className="size-4" />
                                            </button>
                                        </motion.li>
                                    );
                                })}
                            </AnimatePresence>
                        </ul>
                        <p className="mt-2 text-right text-sm text-muted-foreground">
                            Total :{' '}
                            <strong className="text-foreground">
                                {formatQuantity(
                                    catalog,
                                    unit,
                                    totalOf(placements),
                                )}
                            </strong>
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function SmallStepper({
    value,
    onChange,
}: {
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <span className="flex items-center gap-1">
            <motion.button
                type="button"
                whileTap={{ scale: 0.85 }}
                disabled={value <= 1}
                onClick={() => onChange(value - 1)}
                className="grid size-8 place-items-center rounded-xl bg-card shadow-[var(--shadow-soft)] disabled:opacity-35"
                aria-label="Diminuer"
            >
                <Minus className="size-3.5" />
            </motion.button>
            <RollingNumber
                value={value}
                className="w-8 justify-center font-display text-base font-extrabold tabular-nums"
            />
            <motion.button
                type="button"
                whileTap={{ scale: 0.85 }}
                disabled={value >= 999}
                onClick={() => onChange(value + 1)}
                className="grid size-8 place-items-center rounded-xl bg-card shadow-[var(--shadow-soft)] disabled:opacity-35"
                aria-label="Augmenter"
            >
                <Plus className="size-3.5" />
            </motion.button>
        </span>
    );
}
