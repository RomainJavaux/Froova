import { router } from '@inertiajs/react';
import { HandPlatter, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { ItemAvatar } from '@/components/items/item-visuals';
import { PreparationReminder } from '@/components/items/preparation-card';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Spinner } from '@/components/ui/spinner';
import { Stepper } from '@/components/ui/stepper';
import { formatQuantity, unitWord, useCatalog } from '@/lib/catalog';
import items from '@/routes/items';
import type { Item, ItemLocation } from '@/types';

/**
 * "I'm taking some" flow: pick the drawer (when the batch is spread out), how many, confirm.
 */
export function TakeSheet({
    item,
    open,
    onOpenChange,
    onTaken,
    compartmentId = null,
}: {
    item: Item | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTaken?: (item: Item, quantity: number) => void;
    /** Drawer the user is looking at; taken from first. */
    compartmentId?: number | null;
}) {
    const catalog = useCatalog();
    const [quantity, setQuantity] = useState(1);
    const [picked, setPicked] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    if (!item) {
        return null;
    }

    const locations = item.locations;
    const findLocation = (id: number | null) =>
        locations.find((location) => location.compartmentId === id);
    const source: ItemLocation | undefined =
        findLocation(picked) ?? findLocation(compartmentId) ?? locations[0];
    const available = source?.quantity ?? item.quantity;
    const amount = Math.min(quantity, available);
    const multipleFreezers =
        new Set(locations.map((location) => location.freezerId)).size > 1;

    const reset = () => {
        setQuantity(1);
        setPicked(null);
    };

    const submit = (taken: number) => {
        router.post(
            items.take.url(item.id),
            {
                quantity: taken,
                compartment_id: source?.compartmentId ?? null,
            },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    navigator.vibrate?.([12, 40, 12]);
                    onTaken?.(item, taken);
                    onOpenChange(false);
                    reset();
                },
            },
        );
    };

    const remaining = item.quantity - amount;
    const remainingHere = available - amount;

    return (
        <BottomSheet
            open={open}
            onOpenChange={(next) => {
                onOpenChange(next);

                if (!next) {
                    reset();
                }
            }}
            hero={
                <motion.div
                    initial={{ scale: 0.6, rotate: -8 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                >
                    <ItemAvatar
                        item={item}
                        size="xl"
                        className="shadow-[var(--shadow-float)]"
                    />
                </motion.div>
            }
            title={<span className="block text-center">{item.name}</span>}
            description={
                source ? (
                    <span className="flex items-center justify-center gap-1">
                        <MapPin className="size-3.5" /> {source.freezerName} ·{' '}
                        {source.compartmentName}
                    </span>
                ) : undefined
            }
            footer={
                <div className="flex gap-2">
                    {available > 1 && (
                        <Button
                            variant="secondary"
                            size="lg"
                            className="px-4"
                            disabled={processing}
                            onClick={() => submit(available)}
                        >
                            Tout
                        </Button>
                    )}
                    <Button
                        size="lg"
                        className="flex-1"
                        disabled={processing}
                        onClick={() => submit(amount)}
                    >
                        {processing ? (
                            <Spinner />
                        ) : (
                            <HandPlatter className="size-5" />
                        )}
                        Je prends {formatQuantity(catalog, item.unit, amount)}
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col items-center gap-5 py-2">
                {locations.length > 1 && (
                    <div className="w-full">
                        <p className="mb-2 text-center text-xs font-semibold text-muted-foreground">
                            Dans quel tiroir ?
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {locations.map((location) => (
                                <Chip
                                    key={location.compartmentId}
                                    active={
                                        location.compartmentId ===
                                        source?.compartmentId
                                    }
                                    className="h-9"
                                    onClick={() => {
                                        setPicked(location.compartmentId);
                                        setQuantity((value) =>
                                            Math.min(value, location.quantity),
                                        );
                                    }}
                                >
                                    {multipleFreezers &&
                                        `${location.freezerName} › `}
                                    {location.compartmentName}
                                    <span className="rounded-full bg-black/10 px-1.5 text-[11px] tabular-nums dark:bg-white/15">
                                        {location.quantity}
                                    </span>
                                </Chip>
                            ))}
                        </div>
                    </div>
                )}

                <Stepper
                    value={amount}
                    onChange={setQuantity}
                    min={1}
                    max={available}
                    size="lg"
                    suffix={unitWord(catalog, item.unit, amount)}
                    className="w-full max-w-xs"
                />

                <div className="flex w-full max-w-xs gap-1">
                    {Array.from(
                        { length: Math.min(available, 20) },
                        (_, index) => (
                            <motion.span
                                key={index}
                                className="h-2 flex-1 rounded-full"
                                animate={{
                                    backgroundColor:
                                        index < remainingHere
                                            ? 'var(--primary)'
                                            : 'var(--muted)',
                                    scaleY: index >= remainingHere ? 0.6 : 1,
                                }}
                                transition={{ duration: 0.25 }}
                            />
                        ),
                    )}
                </div>

                <p className="text-center text-sm text-muted-foreground">
                    {remaining === 0 ? (
                        <span className="font-semibold text-[color:var(--warm)]">
                            C’est le dernier ! Pense à refaire un batch 🍳
                        </span>
                    ) : (
                        <>
                            Il en restera{' '}
                            <strong className="text-foreground">
                                {formatQuantity(catalog, item.unit, remaining)}
                            </strong>
                            {locations.length > 1 && source && (
                                <>
                                    , dont {remainingHere} dans{' '}
                                    {source.compartmentName}
                                </>
                            )}
                        </>
                    )}
                </p>

                <PreparationReminder item={item} />
            </div>
        </BottomSheet>
    );
}
