import { Link } from '@inertiajs/react';
import { MapPin, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { FreezerVisual } from '@/components/freezer/freezer-visual';
import { findColor, gradient, useCatalog } from '@/lib/catalog';
import { cn } from '@/lib/utils';
import freezersRoutes from '@/routes/freezers';
import type { FreezerOption } from '@/types';

/**
 * Pick where a batch goes by tapping drawers on a drawing of the freezer.
 * Tapping a drawer adds it; tapping it again removes it, so a batch can be spread over several.
 */
export function LocationPicker({
    freezers,
    selectedIds,
    onToggle,
    badges,
    error,
}: {
    freezers: FreezerOption[];
    selectedIds: number[];
    onToggle: (compartmentId: number) => void;
    badges?: Record<string, string>;
    error?: string;
}) {
    const catalog = useCatalog();
    const owner = freezers.find((freezer) =>
        freezer.compartments.some((compartment) =>
            selectedIds.includes(compartment.id),
        ),
    );
    const [freezerId, setFreezerId] = useState<number | null>(
        owner?.id ?? freezers[0]?.id ?? null,
    );
    const freezer =
        freezers.find((candidate) => candidate.id === freezerId) ?? null;
    const compartments = freezers.flatMap((candidate) =>
        candidate.compartments.map((compartment) => ({
            ...compartment,
            freezerName: candidate.name,
        })),
    );
    const selected = compartments.filter((compartment) =>
        selectedIds.includes(compartment.id),
    );

    if (freezers.length === 0) {
        return (
            <div className="rounded-3xl border-2 border-dashed border-border p-6 text-center">
                <p className="font-semibold">Aucun congélateur configuré</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Crée d’abord ton congélateur pour pouvoir y ranger tes
                    batchs.
                </p>
                <Link
                    href={freezersRoutes.create()}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                >
                    <Plus className="size-4" /> Configurer un congélateur
                </Link>
            </div>
        );
    }

    return (
        <div>
            {freezers.length > 1 && (
                <div className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
                    {freezers.map((option) => {
                        const active = option.id === freezerId;
                        const picked = option.compartments.filter(
                            (compartment) =>
                                selectedIds.includes(compartment.id),
                        ).length;

                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => setFreezerId(option.id)}
                                className={cn(
                                    'relative flex h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-colors',
                                    active
                                        ? 'text-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {active && (
                                    <motion.span
                                        layoutId="location-freezer"
                                        className="absolute inset-0 rounded-2xl bg-card shadow-[var(--shadow-soft)] ring-1 ring-[var(--hairline)]"
                                    />
                                )}
                                <span
                                    className="relative size-3 rounded-full"
                                    style={{
                                        background: gradient(
                                            findColor(catalog, option.color),
                                        ),
                                    }}
                                />
                                <span className="relative">{option.name}</span>
                                {picked > 0 && (
                                    <span className="relative rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground tabular-nums">
                                        {picked}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {freezer && (
                <motion.div
                    key={freezer.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-2"
                >
                    <FreezerVisual
                        type={freezer.type}
                        color={freezer.color}
                        name={freezer.name}
                        compartments={freezer.compartments}
                        selectedIds={selectedIds}
                        badges={badges}
                        onSelect={(id) => onToggle(Number(id))}
                        size="md"
                    />
                </motion.div>
            )}

            <motion.div
                layout
                className={cn(
                    'mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold',
                    selected.length > 0
                        ? 'bg-primary/10 text-primary'
                        : error
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-muted text-muted-foreground',
                )}
            >
                <MapPin className="size-4 shrink-0" />
                {selected.length === 1 ? (
                    <span className="truncate">
                        {selected[0].freezerName} › {selected[0].name}
                    </span>
                ) : selected.length > 1 ? (
                    <span>
                        Réparti dans {selected.length} tiroirs — touche un
                        tiroir pour l’ajouter ou le retirer
                    </span>
                ) : (
                    <span>
                        {error ??
                            'Touche un ou plusieurs tiroirs pour ranger ton batch'}
                    </span>
                )}
            </motion.div>
        </div>
    );
}
