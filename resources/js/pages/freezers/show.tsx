import { Head, Link } from '@inertiajs/react';
import { CalendarClock, Plus, Settings2, Snowflake } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FreezerVisual } from '@/components/freezer/freezer-visual';
import { ItemRow } from '@/components/items/item-row';
import { TakeSheet } from '@/components/items/take-sheet';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
    findColor,
    findFreezerType,
    gradient,
    useCatalog,
} from '@/lib/catalog';
import { durationLabel, formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import freezers from '@/routes/freezers';
import itemsRoutes from '@/routes/items';
import type { Freezer, Item } from '@/types';

type Props = {
    freezer: Freezer;
    focus: { compartment: number | null; item: number | null };
};

export default function FreezerShow({ freezer, focus }: Props) {
    const catalog = useCatalog();
    const palette = findColor(catalog, freezer.color);
    const type = findFreezerType(catalog, freezer.type);
    const panelRef = useRef<HTMLDivElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);
    const [taking, setTaking] = useState<Item | null>(null);

    const initial = useMemo(() => {
        const focused = freezer.compartments.find(
            (compartment) => compartment.id === focus.compartment,
        );

        return (
            (
                focused ??
                freezer.compartments.find(
                    (compartment) => compartment.itemsCount > 0,
                ) ??
                freezer.compartments[0]
            )?.id ?? null
        );
    }, [freezer.compartments, focus.compartment]);

    const [selectedId, setSelectedId] = useState<number | null>(initial);
    const selected =
        freezer.compartments.find(
            (compartment) => compartment.id === selectedId,
        ) ?? null;

    useEffect(() => {
        if (!focus.item) {
            return;
        }

        const timer = window.setTimeout(() => {
            highlightRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }, 900);

        return () => window.clearTimeout(timer);
    }, [focus.item]);

    const select = (id: number) => {
        setSelectedId(id);
        navigator.vibrate?.(6);

        if (window.innerWidth < 1024) {
            window.setTimeout(
                () =>
                    panelRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                    }),
                250,
            );
        }
    };

    const defrostDays = freezer.lastDefrostedOn
        ? Math.round(
              (Date.now() -
                  new Date(`${freezer.lastDefrostedOn}T00:00:00`).getTime()) /
                  86400000,
          )
        : null;

    return (
        <>
            <Head title={freezer.name} />

            <PageHeader
                back={freezers.index()}
                eyebrow={
                    <span className="flex items-center gap-1.5">
                        <Snowflake className="size-3.5" /> {type.label}
                        {freezer.location && (
                            <span className="text-muted-foreground">
                                · {freezer.location}
                            </span>
                        )}
                    </span>
                }
                title={freezer.name}
                actions={
                    <>
                        <Button
                            asChild
                            variant="outline"
                            size="icon"
                            aria-label="Configurer"
                        >
                            <Link href={freezers.edit(freezer.id)}>
                                <Settings2 className="size-5" />
                            </Link>
                        </Button>
                        <Button asChild variant="warm">
                            <Link
                                href={itemsRoutes.create({
                                    query: selectedId
                                        ? { compartment: selectedId }
                                        : {},
                                })}
                            >
                                <Plus className="size-5" /> Ranger ici
                            </Link>
                        </Button>
                    </>
                }
            />

            <div className="grid gap-8 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-10">
                {/* Freezer */}
                <div className="lg:sticky lg:top-10 lg:self-start">
                    <div className="relative">
                        <div
                            className="absolute inset-x-8 top-10 bottom-0 -z-10 rounded-full opacity-40 blur-3xl"
                            style={{ background: gradient(palette) }}
                        />
                        <FreezerVisual
                            type={freezer.type}
                            color={freezer.color}
                            name={freezer.name}
                            compartments={freezer.compartments}
                            selectedId={selectedId}
                            highlightId={focus.item ? focus.compartment : null}
                            onSelect={(id) => select(Number(id))}
                            size="lg"
                            animateOpening
                        />
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-2.5">
                        <MiniStat
                            value={freezer.stats.units}
                            label="portions"
                        />
                        <MiniStat value={freezer.stats.items} label="batchs" />
                        <MiniStat
                            value={freezer.stats.expiring}
                            label="à finir"
                            alert={freezer.stats.expiring > 0}
                        />
                    </div>

                    {defrostDays !== null && (
                        <div
                            className={cn(
                                'mt-3 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm',
                                defrostDays > 365
                                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                    : 'bg-muted text-muted-foreground',
                            )}
                        >
                            <CalendarClock className="size-4 shrink-0" />
                            Dégivré le {formatDate(freezer.lastDefrostedOn)} (
                            {durationLabel(defrostDays)})
                            {defrostDays > 365 && ' — pense à le dégivrer !'}
                        </div>
                    )}
                </div>

                {/* Drawer content */}
                <div ref={panelRef} className="scroll-mt-24">
                    <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
                        {freezer.compartments.map((compartment) => {
                            const active = compartment.id === selectedId;

                            return (
                                <button
                                    key={compartment.id}
                                    type="button"
                                    onClick={() => select(compartment.id)}
                                    className={cn(
                                        'relative flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors',
                                        active
                                            ? 'text-white'
                                            : 'bg-card/80 text-muted-foreground ring-1 ring-border hover:text-foreground',
                                    )}
                                >
                                    {active && (
                                        <motion.span
                                            layoutId="compartment-chip"
                                            className="absolute inset-0 rounded-full shadow-[0_8px_20px_-10px_var(--chip)]"
                                            style={{
                                                background: gradient(
                                                    palette,
                                                    120,
                                                ),
                                                ['--chip' as string]:
                                                    palette.to,
                                            }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 500,
                                                damping: 38,
                                            }}
                                        />
                                    )}
                                    <span className="relative">
                                        {compartment.name}
                                    </span>
                                    <span
                                        className={cn(
                                            'relative rounded-full px-1.5 text-[11px] tabular-nums',
                                            active ? 'bg-white/25' : 'bg-muted',
                                        )}
                                    >
                                        {compartment.itemsCount}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <AnimatePresence mode="wait">
                        {selected && (
                            <motion.section
                                key={selected.id}
                                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 320,
                                    damping: 30,
                                }}
                                className="relative overflow-hidden rounded-[30px] border border-[var(--glass-border)] bg-[linear-gradient(180deg,color-mix(in_oklab,#e0f2fe_60%,var(--card)),var(--card))] p-4 shadow-[var(--shadow-float)] sm:p-6 dark:bg-[linear-gradient(180deg,#1c2645,var(--card))]"
                            >
                                <div className="frost-texture pointer-events-none absolute inset-0 opacity-60" />
                                <div
                                    className="absolute inset-x-0 top-0 h-1.5"
                                    style={{
                                        background: gradient(palette, 90),
                                    }}
                                />

                                <div className="relative mb-5 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            {type.compartmentNoun}{' '}
                                            {selected.position}
                                        </p>
                                        <h2 className="font-display text-2xl font-extrabold">
                                            {selected.name}
                                        </h2>
                                    </div>
                                    <Button asChild size="sm" variant="outline">
                                        <Link
                                            href={itemsRoutes.create({
                                                query: {
                                                    compartment: selected.id,
                                                },
                                            })}
                                        >
                                            <Plus className="size-4" /> Ajouter
                                        </Link>
                                    </Button>
                                </div>

                                {(selected.items ?? []).length === 0 ? (
                                    <div className="relative flex flex-col items-center py-10 text-center">
                                        <motion.span
                                            className="text-5xl"
                                            animate={{
                                                rotate: [0, -10, 10, 0],
                                                y: [0, -4, 0],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                            }}
                                        >
                                            🧊
                                        </motion.span>
                                        <p className="mt-3 font-display text-lg font-bold">
                                            Rien ici pour l’instant
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Ce{' '}
                                            {type.compartmentNoun.toLowerCase()}{' '}
                                            n’attend que tes batchs.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative space-y-2.5">
                                        <AnimatePresence initial={true}>
                                            {(selected.items ?? []).map(
                                                (item, index) => (
                                                    <ItemRow
                                                        key={item.id}
                                                        ref={
                                                            item.id ===
                                                            focus.item
                                                                ? highlightRef
                                                                : undefined
                                                        }
                                                        item={item}
                                                        index={index}
                                                        showLocation={false}
                                                        highlighted={
                                                            item.id ===
                                                            focus.item
                                                        }
                                                        onTake={setTaking}
                                                    />
                                                ),
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </motion.section>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <TakeSheet
                item={
                    taking
                        ? {
                              ...taking,
                              location:
                                  taking.location ??
                                  locationFor(freezer, taking),
                          }
                        : null
                }
                open={taking !== null}
                onOpenChange={(open) => !open && setTaking(null)}
            />
        </>
    );
}

function locationFor(freezer: Freezer, item: Item): Item['location'] {
    const compartment = freezer.compartments.find(
        (candidate) => candidate.id === item.compartmentId,
    );

    return compartment
        ? {
              freezerId: freezer.id,
              freezerName: freezer.name,
              freezerColor: freezer.color,
              freezerType: freezer.type,
              compartmentId: compartment.id,
              compartmentName: compartment.name,
              compartmentPosition: compartment.position,
          }
        : null;
}

function MiniStat({
    value,
    label,
    alert = false,
}: {
    value: number;
    label: string;
    alert?: boolean;
}) {
    return (
        <div className="surface rounded-2xl p-3 text-center">
            <div
                className={cn(
                    'font-display text-2xl font-extrabold tabular-nums',
                    alert && 'text-[color:var(--soon)]',
                )}
            >
                {value}
            </div>
            <div className="text-xs font-medium text-muted-foreground">
                {label}
            </div>
        </div>
    );
}
