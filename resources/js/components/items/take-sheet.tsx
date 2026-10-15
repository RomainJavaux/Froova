import { router } from '@inertiajs/react';
import { HandPlatter, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { ItemAvatar } from '@/components/items/item-visuals';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Stepper } from '@/components/ui/stepper';
import { formatQuantity, unitWord, useCatalog } from '@/lib/catalog';
import items from '@/routes/items';
import type { Item } from '@/types';

/**
 * "I'm taking some" flow: pick how many, confirm, done.
 */
export function TakeSheet({
    item,
    open,
    onOpenChange,
    onTaken,
}: {
    item: Item | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTaken?: (item: Item, quantity: number) => void;
}) {
    const catalog = useCatalog();
    const [quantity, setQuantity] = useState(1);
    const [processing, setProcessing] = useState(false);

    if (!item) {
        return null;
    }

    const submit = (amount: number) => {
        router.post(
            items.take.url(item.id),
            { quantity: amount },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    navigator.vibrate?.([12, 40, 12]);
                    onTaken?.(item, amount);
                    onOpenChange(false);
                    setQuantity(1);
                },
            },
        );
    };

    const remaining = item.quantity - quantity;

    return (
        <BottomSheet
            open={open}
            onOpenChange={(next) => {
                onOpenChange(next);

                if (!next) {
                    setQuantity(1);
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
                item.location ? (
                    <span className="flex items-center justify-center gap-1">
                        <MapPin className="size-3.5" />{' '}
                        {item.location.freezerName} ·{' '}
                        {item.location.compartmentName}
                    </span>
                ) : undefined
            }
            footer={
                <div className="flex gap-2">
                    {item.quantity > 1 && (
                        <Button
                            variant="secondary"
                            size="lg"
                            className="px-4"
                            disabled={processing}
                            onClick={() => submit(item.quantity)}
                        >
                            Tout
                        </Button>
                    )}
                    <Button
                        size="lg"
                        className="flex-1"
                        disabled={processing}
                        onClick={() => submit(quantity)}
                    >
                        {processing ? (
                            <Spinner />
                        ) : (
                            <HandPlatter className="size-5" />
                        )}
                        Je prends {formatQuantity(catalog, item.unit, quantity)}
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col items-center gap-5 py-2">
                <Stepper
                    value={quantity}
                    onChange={setQuantity}
                    min={1}
                    max={item.quantity}
                    size="lg"
                    suffix={unitWord(catalog, item.unit, quantity)}
                    className="w-full max-w-xs"
                />

                <div className="flex w-full max-w-xs gap-1">
                    {Array.from(
                        { length: Math.min(item.quantity, 20) },
                        (_, index) => (
                            <motion.span
                                key={index}
                                className="h-2 flex-1 rounded-full"
                                animate={{
                                    backgroundColor:
                                        index < remaining
                                            ? 'var(--primary)'
                                            : 'var(--muted)',
                                    scaleY: index >= remaining ? 0.6 : 1,
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
                        </>
                    )}
                </p>
            </div>
        </BottomSheet>
    );
}
