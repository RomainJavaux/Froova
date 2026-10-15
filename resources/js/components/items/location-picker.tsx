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
 * Pick where a batch goes by tapping the drawer on a drawing of the freezer.
 */
export function LocationPicker({
    freezers,
    value,
    onChange,
    error,
}: {
    freezers: FreezerOption[];
    value: number | null;
    onChange: (compartmentId: number) => void;
    error?: string;
}) {
    const catalog = useCatalog();
    const owner = freezers.find((freezer) =>
        freezer.compartments.some((compartment) => compartment.id === value),
    );
    const [freezerId, setFreezerId] = useState<number | null>(
        owner?.id ?? freezers[0]?.id ?? null,
    );
    const freezer =
        freezers.find((candidate) => candidate.id === freezerId) ?? null;
    const compartment = freezers
        .flatMap((candidate) => candidate.compartments)
        .find((candidate) => candidate.id === value);

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
                        selectedId={value}
                        onSelect={(id) => onChange(Number(id))}
                        size="md"
                    />
                </motion.div>
            )}

            <motion.div
                layout
                className={cn(
                    'mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold',
                    compartment
                        ? 'bg-primary/10 text-primary'
                        : error
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-muted text-muted-foreground',
                )}
            >
                <MapPin className="size-4 shrink-0" />
                {compartment ? (
                    <span className="truncate">
                        {owner?.name} › {compartment.name}
                    </span>
                ) : (
                    <span>
                        {error ??
                            'Touche un tiroir pour choisir où ranger ton batch'}
                    </span>
                )}
            </motion.div>
        </div>
    );
}
