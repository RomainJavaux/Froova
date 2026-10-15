import { motion } from 'motion/react';
import { findCategory, useCatalog } from '@/lib/catalog';
import { freshnessLabel } from '@/lib/dates';
import { cn } from '@/lib/utils';
import type { Freshness, Item } from '@/types';

const FRESHNESS_COLORS: Record<Freshness['status'], string> = {
    fresh: 'var(--fresh)',
    soon: 'var(--soon)',
    expired: 'var(--expired)',
    unknown: 'var(--muted-foreground)',
};

export function freshnessColor(freshness: Freshness): string {
    return FRESHNESS_COLORS[freshness.status];
}

/**
 * Photo of the dish, or its emoji on a soft tinted tile.
 */
export function ItemAvatar({
    item,
    size = 'md',
    className,
}: {
    item: Pick<Item, 'photoUrl' | 'displayEmoji' | 'category' | 'name'>;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}) {
    const catalog = useCatalog();
    const color = findCategory(catalog, item.category)?.color ?? '#64748b';

    const sizes = {
        sm: 'size-10 rounded-xl text-xl',
        md: 'size-14 rounded-2xl text-[28px]',
        lg: 'size-20 rounded-[22px] text-4xl',
        xl: 'size-28 rounded-[28px] text-6xl',
    };

    return (
        <div
            className={cn(
                'relative grid shrink-0 place-items-center overflow-hidden',
                sizes[size],
                className,
            )}
            style={{
                background: `linear-gradient(145deg, color-mix(in oklab, ${color} 16%, var(--card)), color-mix(in oklab, ${color} 30%, var(--card)))`,
            }}
        >
            {item.photoUrl ? (
                <img
                    src={item.photoUrl}
                    alt={item.name}
                    loading="lazy"
                    className="size-full object-cover"
                />
            ) : (
                <span className="drop-shadow-[0_4px_6px_rgb(0_0_0/0.12)] select-none">
                    {item.displayEmoji}
                </span>
            )}
        </div>
    );
}

export function FreshnessBadge({
    freshness,
    className,
}: {
    freshness: Freshness;
    className?: string;
}) {
    const color = freshnessColor(freshness);

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap',
                className,
            )}
            style={{
                color: `color-mix(in oklab, ${color} 80%, var(--foreground))`,
                background: `color-mix(in oklab, ${color} 14%, transparent)`,
            }}
        >
            <span className="relative flex size-2">
                {freshness.status !== 'fresh' &&
                    freshness.status !== 'unknown' && (
                        <span
                            className="absolute inline-flex size-full animate-ping rounded-full opacity-60"
                            style={{ background: color }}
                        />
                    )}
                <span
                    className="relative inline-flex size-2 rounded-full"
                    style={{ background: color }}
                />
            </span>
            {freshnessLabel(freshness)}
        </span>
    );
}

/**
 * Circular gauge showing how much of the recommended storage time is used up.
 */
export function FreshnessRing({
    freshness,
    size = 44,
    stroke = 4,
    children,
    className,
}: {
    freshness: Freshness;
    size?: number;
    stroke?: number;
    children?: React.ReactNode;
    className?: string;
}) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const remaining = freshness.progress === null ? 1 : 1 - freshness.progress;
    const color = freshnessColor(freshness);

    return (
        <div
            className={cn(
                'relative grid shrink-0 place-items-center',
                className,
            )}
            style={{ width: size, height: size }}
        >
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={stroke}
                    className="text-muted"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{
                        strokeDashoffset:
                            circumference * (1 - Math.max(0.04, remaining)),
                    }}
                    transition={{
                        duration: 1.1,
                        ease: [0.16, 1, 0.3, 1],
                        delay: 0.15,
                    }}
                />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
                {children}
            </div>
        </div>
    );
}

export function QuantityBar({
    item,
    className,
}: {
    item: Pick<Item, 'quantity' | 'initialQuantity'>;
    className?: string;
}) {
    const ratio =
        item.initialQuantity > 0
            ? Math.min(1, item.quantity / item.initialQuantity)
            : 0;

    return (
        <div
            className={cn(
                'h-1.5 overflow-hidden rounded-full bg-muted',
                className,
            )}
        >
            <motion.div
                className="h-full rounded-full bg-[linear-gradient(90deg,#7dd3fc,var(--primary))]"
                initial={{ width: 0 }}
                animate={{ width: `${ratio * 100}%` }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
        </div>
    );
}
