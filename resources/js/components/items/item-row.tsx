import { Link } from '@inertiajs/react';
import { HandPlatter, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { forwardRef } from 'react';
import { FreshnessBadge, ItemAvatar } from '@/components/items/item-visuals';
import { findColor, formatQuantity, gradient, useCatalog } from '@/lib/catalog';
import { cn } from '@/lib/utils';
import freezers from '@/routes/freezers';
import items from '@/routes/items';
import type { Item } from '@/types';

type ItemRowProps = {
    item: Item;
    onTake?: (item: Item) => void;
    showLocation?: boolean;
    highlighted?: boolean;
    index?: number;
    className?: string;
};

/**
 * One frozen batch in a list: photo, name, how much is left, freshness and quick actions.
 */
export const ItemRow = forwardRef<HTMLDivElement, ItemRowProps>(
    function ItemRow(
        {
            item,
            onTake,
            showLocation = true,
            highlighted = false,
            index = 0,
            className,
        },
        ref,
    ) {
        const catalog = useCatalog();

        return (
            <motion.div
                ref={ref}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                    opacity: 0,
                    scale: 0.94,
                    transition: { duration: 0.18 },
                }}
                transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 32,
                    delay: Math.min(index, 12) * 0.03,
                }}
                className={cn('group relative', className)}
            >
                {highlighted && (
                    <motion.span
                        className="absolute -inset-1 rounded-[26px] ring-4 ring-primary/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0.4, 1, 0.6] }}
                        transition={{ duration: 2, delay: 0.9 }}
                    />
                )}

                <div className="surface relative flex items-center gap-3.5 rounded-[22px] p-3 transition-shadow hover:shadow-[var(--shadow-float)]">
                    <ItemAvatar item={item} />

                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[15px] font-bold">
                            {/* Stretched link: the whole card opens the item, without nesting the location link inside it. */}
                            <Link
                                href={items.show(item.id)}
                                prefetch
                                className="outline-none after:absolute after:inset-0 after:rounded-[22px] focus-visible:after:ring-4 focus-visible:after:ring-ring/30"
                            >
                                {item.name}
                            </Link>
                        </h3>

                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
                            <span className="font-semibold text-foreground/80">
                                {formatQuantity(
                                    catalog,
                                    item.unit,
                                    item.hereQuantity ?? item.quantity,
                                )}
                            </span>
                            {item.hereQuantity !== null &&
                                item.hereQuantity !== item.quantity && (
                                    <span>· {item.quantity} au total</span>
                                )}
                            {item.servings && (
                                <span>· {item.servings} pers.</span>
                            )}
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <FreshnessBadge freshness={item.freshness} />
                            {showLocation && (
                                <LocationPill
                                    item={item}
                                    className="relative z-10"
                                />
                            )}
                        </div>
                    </div>

                    {onTake && (
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onTake(item)}
                            className="relative z-10 grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary transition hover:bg-primary hover:text-primary-foreground"
                            aria-label={`Prendre ${item.name}`}
                            title="Je prends"
                        >
                            <HandPlatter className="size-5" />
                        </motion.button>
                    )}
                </div>
            </motion.div>
        );
    },
);

export function LocationPill({
    item,
    className,
}: {
    item: Item;
    className?: string;
}) {
    const catalog = useCatalog();

    if (!item.location) {
        return (
            <span
                className={cn(
                    'inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground',
                    className,
                )}
            >
                <MapPin className="size-3" /> À ranger
            </span>
        );
    }

    const palette = findColor(catalog, item.location.freezerColor);

    return (
        <Link
            href={freezers.show(item.location.freezerId, {
                query: {
                    compartment: item.location.compartmentId,
                    item: item.id,
                },
            })}
            className={cn(
                'inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted/80 py-1 pr-2.5 pl-1 text-[11.5px] font-semibold text-foreground/75 transition hover:bg-accent hover:text-foreground',
                className,
            )}
            title={item.locations
                .map(
                    (location) =>
                        `${location.freezerName} › ${location.compartmentName} (${location.quantity})`,
                )
                .join('\n')}
        >
            <span
                className="grid size-4 place-items-center rounded-full text-[9px] text-white"
                style={{ background: gradient(palette) }}
            >
                <MapPin className="size-2.5" />
            </span>
            <span className="truncate">
                {item.location.freezerName} › {item.location.compartmentName}
            </span>
            {item.locations.length > 1 && (
                <span className="shrink-0 rounded-full bg-primary/12 px-1.5 text-[10.5px] font-bold text-primary">
                    +{item.locations.length - 1}
                </span>
            )}
        </Link>
    );
}
