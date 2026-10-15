import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';
import { findColor, gradient, useCatalog } from '@/lib/catalog';
import { cn } from '@/lib/utils';
import type { FreezerType, PaletteColor } from '@/types';

export type VisualCompartment = {
    id: number | string;
    name: string;
    itemsCount?: number;
    previewEmojis?: string[];
    expiringCount?: number | null;
};

export type FreezerSize = 'xs' | 'sm' | 'md' | 'lg';

type FreezerVisualProps = {
    type: FreezerType;
    color: string;
    name?: string;
    compartments: VisualCompartment[];
    selectedId?: number | string | null;
    highlightId?: number | string | null;
    onSelect?: (id: number | string) => void;
    size?: FreezerSize;
    /** Swing the door / lift the lid when the freezer first appears. */
    animateOpening?: boolean;
    className?: string;
};

const WIDTHS: Record<FreezerSize, Record<FreezerType, number | string>> = {
    xs: { upright: 46, combo: 46, compact: 54, chest: 82 },
    sm: { upright: 132, combo: 132, compact: 150, chest: 210 },
    md: { upright: 210, combo: 210, compact: 230, chest: 320 },
    lg: {
        upright: 'min(100%, 330px)',
        combo: 'min(100%, 330px)',
        compact: 'min(100%, 340px)',
        chest: 'min(100%, 460px)',
    },
};

function drawerHeight(size: FreezerSize, count: number): number {
    const table: Record<FreezerSize, [number, number, number]> = {
        xs: [9, 7, 5],
        sm: [30, 22, 16],
        md: [46, 36, 28],
        lg: [66, 50, 40],
    };
    const [few, some, many] = table[size];

    return count <= 5 ? few : count <= 8 ? some : many;
}

const bodyClass =
    'relative bg-[linear-gradient(160deg,#ffffff,#e6ecf5)] shadow-[0_2px_4px_rgb(15_23_42/0.06),0_30px_60px_-30px_rgb(30_41_99/0.45),inset_0_1px_0_white] ring-1 ring-slate-900/5 dark:bg-[linear-gradient(160deg,#3b4566,#252c47)] dark:shadow-[0_30px_60px_-30px_rgb(0_0_0/0.7),inset_0_1px_0_rgb(255_255_255/0.08)] dark:ring-white/10';

const interiorClass =
    'frost-texture relative bg-[linear-gradient(180deg,#e0f2fe,#eef2ff)] shadow-[inset_0_2px_12px_rgb(30_41_99/0.18)] dark:bg-[linear-gradient(180deg,#1c2645,#131a31)] dark:shadow-[inset_0_2px_12px_rgb(0_0_0/0.5)]';

export function FreezerVisual({
    type,
    color,
    name,
    compartments,
    selectedId = null,
    highlightId = null,
    onSelect,
    size = 'md',
    animateOpening = false,
    className,
}: FreezerVisualProps) {
    const catalog = useCatalog();
    const palette = findColor(catalog, color);
    const width = WIDTHS[size][type];
    const instanceId = useId();

    const shared = {
        palette,
        name,
        compartments,
        selectedId,
        highlightId,
        onSelect,
        size,
        animateOpening,
        instanceId,
    };

    return (
        <div
            className={cn('relative mx-auto select-none', className)}
            style={{ width }}
        >
            {type === 'chest' ? (
                <ChestFreezer {...shared} />
            ) : type === 'combo' ? (
                <ComboFreezer {...shared} />
            ) : (
                <UprightFreezer {...shared} compact={type === 'compact'} />
            )}
        </div>
    );
}

type InnerProps = {
    palette: PaletteColor;
    name?: string;
    compartments: VisualCompartment[];
    selectedId: number | string | null;
    highlightId: number | string | null;
    onSelect?: (id: number | string) => void;
    size: FreezerSize;
    animateOpening: boolean;
    instanceId: string;
};

function Header({
    palette,
    name,
    size,
}: {
    palette: PaletteColor;
    name?: string;
    size: FreezerSize;
}) {
    if (size === 'xs') {
        return (
            <div
                className="mb-[3px] h-[5px] rounded-[3px]"
                style={{ background: gradient(palette, 90) }}
            />
        );
    }

    const big = size === 'lg' || size === 'md';

    return (
        <div
            className={cn(
                'relative flex items-center justify-between overflow-hidden text-white',
                big
                    ? 'mb-2.5 h-11 rounded-2xl px-3.5'
                    : 'mb-1.5 h-6 rounded-lg px-2',
            )}
            style={{ background: gradient(palette, 100) }}
        >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20" />
            <span
                className={cn(
                    'relative truncate font-display font-bold drop-shadow-sm',
                    big ? 'text-sm' : 'text-[9px]',
                )}
            >
                {name}
            </span>
            {size !== 'sm' && (
                <span className="relative flex items-center gap-1 rounded-lg bg-slate-950/55 px-2 py-0.5 font-mono text-[11px] font-semibold text-cyan-200 shadow-inner">
                    <span className="size-1.5 animate-pulse rounded-full bg-cyan-300" />
                    -18°
                </span>
            )}
        </div>
    );
}

function Feet({ size }: { size: FreezerSize }) {
    if (size === 'xs') {
        return null;
    }

    return (
        <div className="flex justify-between px-[12%]">
            <div
                className={cn(
                    'rounded-b-md bg-slate-300 dark:bg-slate-700',
                    size === 'sm' ? 'h-1.5 w-3' : 'h-2 w-5',
                )}
            />
            <div
                className={cn(
                    'rounded-b-md bg-slate-300 dark:bg-slate-700',
                    size === 'sm' ? 'h-1.5 w-3' : 'h-2 w-5',
                )}
            />
        </div>
    );
}

function UprightFreezer(props: InnerProps & { compact: boolean }) {
    const { palette, name, size, animateOpening, compartments, compact } =
        props;
    const [doorGone, setDoorGone] = useState(!animateOpening);
    const pad =
        size === 'xs'
            ? 'p-[4px] rounded-[9px]'
            : size === 'sm'
              ? 'p-2 rounded-[20px]'
              : 'p-3 rounded-[30px]';

    return (
        <div style={{ perspective: 1400 }}>
            <div className={cn(bodyClass, pad)}>
                <Header palette={palette} name={name} size={size} />

                <div
                    className={cn(
                        interiorClass,
                        size === 'xs'
                            ? 'rounded-[5px] p-[3px]'
                            : size === 'sm'
                              ? 'rounded-xl p-1.5'
                              : 'rounded-[20px] p-2.5',
                        compact && size !== 'xs' && 'pb-3',
                    )}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    <DrawerStack {...props} variant="glass" />

                    {!doorGone && (
                        <motion.div
                            className="absolute -inset-1 z-20 rounded-[22px] border border-white/80 bg-[linear-gradient(160deg,#ffffff,#e3e9f3)] shadow-xl dark:border-white/10 dark:bg-[linear-gradient(160deg,#414b6d,#2a3150)]"
                            style={{
                                transformOrigin: 'left center',
                                backfaceVisibility: 'hidden',
                            }}
                            initial={{ rotateY: 0 }}
                            animate={{ rotateY: -112, opacity: [1, 1, 0] }}
                            transition={{
                                delay: 0.35,
                                duration: 1.1,
                                ease: [0.65, 0, 0.35, 1],
                            }}
                            onAnimationComplete={() => setDoorGone(true)}
                        >
                            <div className="absolute top-1/2 right-4 h-24 w-2 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#cbd5e1,#f8fafc,#94a3b8)] shadow" />
                            <div className="absolute inset-x-6 top-6 grid place-items-center text-5xl opacity-20">
                                ❄
                            </div>
                        </motion.div>
                    )}
                </div>

                {compact && size !== 'xs' && compartments.length > 0 && (
                    <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                )}
            </div>
            <Feet size={size} />
        </div>
    );
}

function ComboFreezer(props: InnerProps) {
    const { palette, name, size } = props;
    const pad =
        size === 'xs'
            ? 'p-[4px] rounded-[9px]'
            : size === 'sm'
              ? 'p-2 rounded-[20px]'
              : 'p-3 rounded-[30px]';
    const fridgeHeight = { xs: 26, sm: 70, md: 110, lg: 150 }[size];

    return (
        <div>
            <div className={cn(bodyClass, pad)}>
                <Header palette={palette} name={name} size={size} />

                <div
                    className={cn(
                        'relative mb-2 flex items-center justify-center bg-[linear-gradient(160deg,#f8fafc,#e2e8f0)] text-slate-400 ring-1 ring-slate-900/5 dark:bg-[linear-gradient(160deg,#2f3756,#262d47)] dark:text-slate-500 dark:ring-white/5',
                        size === 'xs'
                            ? 'mb-[3px] rounded-[5px]'
                            : 'rounded-2xl',
                    )}
                    style={{ height: fridgeHeight }}
                >
                    {size !== 'xs' && (
                        <>
                            <span
                                className={cn(
                                    'font-semibold tracking-wide uppercase',
                                    size === 'sm' ? 'text-[8px]' : 'text-xs',
                                )}
                            >
                                Frigo
                            </span>
                            <div
                                className={cn(
                                    'absolute right-3 rounded-full bg-slate-300 dark:bg-slate-600',
                                    size === 'sm'
                                        ? 'top-3 h-8 w-1'
                                        : 'top-5 h-14 w-1.5',
                                )}
                            />
                        </>
                    )}
                </div>

                <div
                    className={cn(
                        'flex flex-col',
                        size === 'xs' ? 'gap-[2px]' : 'gap-1.5',
                    )}
                >
                    <DrawerStack {...props} variant="solid" />
                </div>
            </div>
            <Feet size={size} />
        </div>
    );
}

function DrawerStack({
    compartments,
    selectedId,
    highlightId,
    onSelect,
    size,
    palette,
    variant,
    instanceId,
}: InnerProps & { variant: 'glass' | 'solid' }) {
    const height = drawerHeight(size, compartments.length);
    const gap = size === 'xs' ? 'gap-[2px]' : size === 'sm' ? 'gap-1' : 'gap-2';

    return (
        <div className={cn('flex flex-col', gap)}>
            <AnimatePresence initial={false}>
                {compartments.map((compartment, index) => (
                    <Drawer
                        key={compartment.id}
                        compartment={compartment}
                        index={index}
                        height={height}
                        size={size}
                        palette={palette}
                        variant={variant}
                        ringId={`ring-${instanceId}`}
                        selected={selectedId === compartment.id}
                        dimmed={
                            selectedId !== null && selectedId !== compartment.id
                        }
                        highlighted={highlightId === compartment.id}
                        onSelect={onSelect}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

function Drawer({
    compartment,
    index,
    height,
    size,
    palette,
    variant,
    ringId,
    selected,
    dimmed,
    highlighted,
    onSelect,
}: {
    compartment: VisualCompartment;
    index: number;
    height: number;
    size: FreezerSize;
    palette: PaletteColor;
    variant: 'glass' | 'solid';
    ringId: string;
    selected: boolean;
    dimmed: boolean;
    highlighted: boolean;
    onSelect?: (id: number | string) => void;
}) {
    const interactive = Boolean(onSelect);
    const count = compartment.itemsCount ?? 0;
    const showText = size === 'md' || size === 'lg';
    const tiny = size === 'xs';

    return (
        <motion.button
            type="button"
            layout
            disabled={!interactive}
            onClick={() => onSelect?.(compartment.id)}
            initial={{ opacity: 0, x: -14, scaleY: 0.6 }}
            animate={{
                opacity: dimmed ? 0.55 : 1,
                x: 0,
                scaleY: 1,
                scale: selected ? 1.07 : 1,
                y: selected ? -2 : 0,
                zIndex: selected ? 10 : 1,
            }}
            exit={{
                opacity: 0,
                x: 18,
                scaleY: 0.5,
                transition: { duration: 0.2 },
            }}
            transition={{
                type: 'spring',
                stiffness: 380,
                damping: 26,
                delay: tiny ? 0 : index * 0.035,
            }}
            whileHover={interactive && !selected ? { scale: 1.025 } : undefined}
            whileTap={interactive ? { scale: 0.98 } : undefined}
            className={cn(
                'group relative w-full overflow-hidden text-left outline-none',
                tiny
                    ? 'rounded-[3px]'
                    : size === 'sm'
                      ? 'rounded-lg'
                      : 'rounded-2xl',
                variant === 'glass'
                    ? 'border border-white/90 bg-white/65 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.07]'
                    : 'border border-slate-900/5 bg-[linear-gradient(180deg,#ffffff,#eef2f8)] dark:border-white/5 dark:bg-[linear-gradient(180deg,#3d4769,#2c3453)]',
                interactive &&
                    'cursor-pointer focus-visible:ring-4 focus-visible:ring-ring/40',
                selected && 'shadow-[0_18px_40px_-14px_var(--drawer-glow)]',
                !selected && !tiny && 'shadow-[0_1px_2px_rgb(15_23_42/0.06)]',
            )}
            style={{ height, ['--drawer-glow' as string]: palette.to }}
        >
            {selected && (
                <motion.span
                    layoutId={ringId}
                    className="absolute inset-0 rounded-[inherit] ring-[2.5px] ring-inset"
                    style={{ ['--tw-ring-color' as string]: palette.to }}
                />
            )}

            {highlighted && (
                <motion.span
                    className="absolute inset-0 rounded-[inherit]"
                    style={{ background: palette.to }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.35, 0, 0.35, 0] }}
                    transition={{ duration: 1.8, delay: 0.8 }}
                />
            )}

            {/* Handle */}
            {!tiny && (
                <span
                    className={cn(
                        'absolute left-1/2 -translate-x-1/2 rounded-full',
                        variant === 'solid'
                            ? 'top-1.5 h-1 w-2/5 bg-[linear-gradient(90deg,#cbd5e1,#f1f5f9,#94a3b8)]'
                            : 'top-1 h-[3px] w-1/4 bg-slate-400/40 dark:bg-white/20',
                        size === 'sm' && 'top-[3px] h-[2px]',
                    )}
                />
            )}

            {/* Accent stripe */}
            {!tiny && (
                <span
                    className="absolute inset-y-0 left-0 w-1 opacity-80"
                    style={{ background: gradient(palette, 180) }}
                />
            )}

            {showText && (
                <span className="relative flex h-full items-center gap-2 pr-3 pl-4">
                    <span className="min-w-0 flex-1">
                        <span
                            className={cn(
                                'block truncate font-semibold',
                                size === 'lg' ? 'text-[13.5px]' : 'text-xs',
                            )}
                        >
                            {compartment.name}
                        </span>
                        {height >= 46 && (
                            <span className="block text-[11px] text-muted-foreground">
                                {count === 0
                                    ? 'Vide'
                                    : `${count} article${count > 1 ? 's' : ''}`}
                                {compartment.expiringCount ? (
                                    <span className="ml-1 font-semibold text-[color:var(--soon)]">
                                        · {compartment.expiringCount} à finir
                                    </span>
                                ) : null}
                            </span>
                        )}
                    </span>

                    <span className="flex -space-x-1.5">
                        {(compartment.previewEmojis ?? [])
                            .slice(0, size === 'lg' ? 4 : 3)
                            .map((emoji, emojiIndex) => (
                                <motion.span
                                    key={`${emoji}-${emojiIndex}`}
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{
                                        delay: 0.5 + emojiIndex * 0.06,
                                    }}
                                    className={cn(
                                        'grid place-items-center rounded-full bg-white/80 shadow-sm ring-1 ring-black/5 dark:bg-white/10',
                                        size === 'lg' && height >= 46
                                            ? 'size-8 text-lg'
                                            : 'size-6 text-sm',
                                    )}
                                >
                                    {emoji}
                                </motion.span>
                            ))}
                    </span>

                    {height < 46 && count > 0 && (
                        <span className="rounded-full bg-foreground/8 px-1.5 text-[10px] font-bold tabular-nums">
                            {count}
                        </span>
                    )}
                </span>
            )}

            {size === 'sm' && count > 0 && (
                <span className="absolute top-1/2 right-1.5 grid min-w-4 -translate-y-1/2 place-items-center rounded-full bg-foreground/10 px-1 text-[9px] font-bold tabular-nums">
                    {count}
                </span>
            )}
        </motion.button>
    );
}

function ChestFreezer({
    palette,
    name,
    compartments,
    selectedId,
    highlightId,
    onSelect,
    size,
    animateOpening,
}: InnerProps) {
    const [lidGone, setLidGone] = useState(!animateOpening);
    const count = compartments.length;
    const columns = count <= 3 ? Math.max(1, count) : Math.ceil(count / 2);
    const basketHeight = { xs: 14, sm: 46, md: 74, lg: 104 }[size];
    const tiny = size === 'xs';

    return (
        <div style={{ perspective: 1200 }}>
            <div
                className={cn(
                    bodyClass,
                    tiny
                        ? 'rounded-[8px] p-[4px]'
                        : size === 'sm'
                          ? 'rounded-[20px] p-2'
                          : 'rounded-[30px] p-3',
                )}
            >
                <Header palette={palette} name={name} size={size} />

                <div
                    className={cn(
                        interiorClass,
                        tiny
                            ? 'rounded-[5px] p-[3px]'
                            : size === 'sm'
                              ? 'rounded-xl p-1.5'
                              : 'rounded-[20px] p-2.5',
                    )}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    <div
                        className={cn(
                            'grid',
                            tiny
                                ? 'gap-[2px]'
                                : size === 'sm'
                                  ? 'gap-1'
                                  : 'gap-2',
                        )}
                        style={{
                            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                        }}
                    >
                        <AnimatePresence initial={false}>
                            {compartments.map((compartment, index) => {
                                const selected = selectedId === compartment.id;
                                const itemsCount = compartment.itemsCount ?? 0;

                                return (
                                    <motion.button
                                        key={compartment.id}
                                        type="button"
                                        layout
                                        disabled={!onSelect}
                                        onClick={() =>
                                            onSelect?.(compartment.id)
                                        }
                                        initial={{ opacity: 0, scale: 0.7 }}
                                        animate={{
                                            opacity:
                                                selectedId !== null && !selected
                                                    ? 0.55
                                                    : 1,
                                            scale: selected ? 1.06 : 1,
                                            y: selected ? -6 : 0,
                                            zIndex: selected ? 10 : 1,
                                        }}
                                        exit={{ opacity: 0, scale: 0.6 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 380,
                                            damping: 24,
                                            delay: tiny ? 0 : index * 0.04,
                                        }}
                                        whileHover={
                                            onSelect && !selected
                                                ? { y: -3 }
                                                : undefined
                                        }
                                        whileTap={
                                            onSelect
                                                ? { scale: 0.97 }
                                                : undefined
                                        }
                                        className={cn(
                                            'wire-mesh relative flex flex-col justify-between overflow-hidden border border-slate-300/70 bg-white/45 text-left dark:border-white/10 dark:bg-white/5',
                                            tiny
                                                ? 'rounded-[3px]'
                                                : 'rounded-xl p-2',
                                            selected &&
                                                'shadow-[0_22px_40px_-16px_var(--drawer-glow)]',
                                        )}
                                        style={{
                                            height: basketHeight,
                                            ['--drawer-glow' as string]:
                                                palette.to,
                                        }}
                                    >
                                        {selected && (
                                            <span
                                                className="absolute inset-0 rounded-[inherit] ring-[2.5px] ring-inset"
                                                style={{
                                                    ['--tw-ring-color' as string]:
                                                        palette.to,
                                                }}
                                            />
                                        )}
                                        {highlightId === compartment.id && (
                                            <motion.span
                                                className="absolute inset-0"
                                                style={{
                                                    background: palette.to,
                                                }}
                                                initial={{ opacity: 0 }}
                                                animate={{
                                                    opacity: [
                                                        0, 0.35, 0, 0.35, 0,
                                                    ],
                                                }}
                                                transition={{
                                                    duration: 1.8,
                                                    delay: 0.9,
                                                }}
                                            />
                                        )}

                                        {!tiny && (
                                            <>
                                                <span className="relative flex flex-wrap gap-0.5">
                                                    {(
                                                        compartment.previewEmojis ??
                                                        []
                                                    )
                                                        .slice(
                                                            0,
                                                            size === 'lg'
                                                                ? 4
                                                                : 2,
                                                        )
                                                        .map(
                                                            (
                                                                emoji,
                                                                emojiIndex,
                                                            ) => (
                                                                <span
                                                                    key={
                                                                        emojiIndex
                                                                    }
                                                                    className={
                                                                        size ===
                                                                        'sm'
                                                                            ? 'text-sm'
                                                                            : 'text-xl'
                                                                    }
                                                                >
                                                                    {emoji}
                                                                </span>
                                                            ),
                                                        )}
                                                </span>
                                                {size !== 'sm' ? (
                                                    <span className="relative rounded-lg bg-white/85 px-2 py-1 backdrop-blur dark:bg-slate-900/60">
                                                        <span className="block truncate text-xs font-semibold">
                                                            {compartment.name}
                                                        </span>
                                                        <span className="block text-[10.5px] text-muted-foreground">
                                                            {itemsCount === 0
                                                                ? 'Vide'
                                                                : `${itemsCount} article${itemsCount > 1 ? 's' : ''}`}
                                                        </span>
                                                    </span>
                                                ) : (
                                                    itemsCount > 0 && (
                                                        <span className="relative self-end rounded-full bg-white/90 px-1.5 text-[9px] font-bold dark:bg-slate-900/70">
                                                            {itemsCount}
                                                        </span>
                                                    )
                                                )}
                                            </>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {!lidGone && (
                        <motion.div
                            className="absolute -inset-1 z-20 rounded-[22px] border border-white/80 shadow-xl dark:border-white/10"
                            style={{
                                transformOrigin: 'top center',
                                backfaceVisibility: 'hidden',
                                background: gradient(palette, 160),
                            }}
                            initial={{ rotateX: 0 }}
                            animate={{ rotateX: 96, opacity: [1, 1, 0] }}
                            transition={{
                                delay: 0.35,
                                duration: 1,
                                ease: [0.65, 0, 0.35, 1],
                            }}
                            onAnimationComplete={() => setLidGone(true)}
                        >
                            <div className="absolute inset-x-[30%] bottom-3 h-2 rounded-full bg-white/60" />
                        </motion.div>
                    )}
                </div>
            </div>
            <Feet size={size} />
        </div>
    );
}
