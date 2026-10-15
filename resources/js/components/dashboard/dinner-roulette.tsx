import { Dices, HandPlatter, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { LocationPill } from '@/components/items/item-row';
import { ItemAvatar } from '@/components/items/item-visuals';
import { Button } from '@/components/ui/button';
import { formatQuantity, useCatalog } from '@/lib/catalog';
import type { Item } from '@/types';

/**
 * "What's for dinner?" slot machine, nudging towards dishes that should be eaten soon.
 */
export function DinnerRoulette({
    suggestions,
    onTake,
}: {
    suggestions: Item[];
    onTake: (item: Item) => void;
}) {
    const catalog = useCatalog();
    const [state, setState] = useState<'idle' | 'spinning' | 'done'>('idle');
    const [current, setCurrent] = useState<Item | null>(null);
    const [tick, setTick] = useState(0);
    const timers = useRef<number[]>([]);

    useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

    const pickWeighted = (): Item => {
        const weights = suggestions.map((item) =>
            item.freshness.status === 'expired'
                ? 4
                : item.freshness.status === 'soon'
                  ? 3
                  : 1,
        );
        let roll =
            Math.random() * weights.reduce((sum, weight) => sum + weight, 0);

        for (let index = 0; index < suggestions.length; index++) {
            roll -= weights[index];

            if (roll <= 0) {
                return suggestions[index];
            }
        }

        return suggestions[0];
    };

    const spin = () => {
        if (suggestions.length === 0) {
            return;
        }

        timers.current.forEach(window.clearTimeout);
        timers.current = [];
        setState('spinning');

        const winner = pickWeighted();
        const steps = 14;
        let elapsed = 0;

        for (let step = 0; step < steps; step++) {
            elapsed += 45 + step * step * 2.2;
            const isLast = step === steps - 1;

            timers.current.push(
                window.setTimeout(() => {
                    setCurrent(
                        isLast
                            ? winner
                            : suggestions[
                                  Math.floor(Math.random() * suggestions.length)
                              ],
                    );
                    setTick((value) => value + 1);
                    setTick((value) => value + 1);
                    navigator.vibrate?.(isLast ? 18 : 4);

                    if (isLast) {
                        setState('done');
                    }
                }, elapsed),
            );
        }
    };

    return (
        <div className="surface relative flex h-full flex-col overflow-hidden p-5">
            <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--warm)_35%,transparent),transparent_70%)]" />

            <div className="relative flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold tracking-wide text-[color:var(--warm)] uppercase">
                        Idée repas
                    </p>
                    <h2 className="font-display text-xl font-extrabold">
                        Ce soir, on mange quoi ?
                    </h2>
                </div>
                <motion.span
                    className="text-3xl"
                    animate={
                        state === 'spinning'
                            ? { rotate: [0, 360] }
                            : { rotate: 0 }
                    }
                    transition={
                        state === 'spinning'
                            ? {
                                  duration: 0.5,
                                  repeat: Infinity,
                                  ease: 'linear',
                              }
                            : {}
                    }
                >
                    🎲
                </motion.span>
            </div>

            <div className="relative my-4 grid min-h-[132px] flex-1 place-items-center overflow-hidden rounded-3xl bg-muted/60 p-3 ring-1 ring-[var(--hairline)] ring-inset">
                {suggestions.length === 0 ? (
                    <p className="px-4 text-center text-sm text-muted-foreground">
                        Range quelques plats cuisinés et on te fera des
                        suggestions ✨
                    </p>
                ) : (
                    <AnimatePresence mode="popLayout" initial={false}>
                        {current ? (
                            <motion.div
                                key={tick}
                                initial={{
                                    y: -60,
                                    opacity: 0,
                                    filter: 'blur(6px)',
                                }}
                                animate={{
                                    y: 0,
                                    opacity: 1,
                                    filter: 'blur(0px)',
                                    scale: state === 'done' ? [1, 1.06, 1] : 1,
                                }}
                                exit={{
                                    y: 60,
                                    opacity: 0,
                                    filter: 'blur(6px)',
                                }}
                                transition={{
                                    duration: state === 'done' ? 0.45 : 0.09,
                                }}
                                className="flex w-full items-center gap-3"
                            >
                                <ItemAvatar item={current} size="lg" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-display text-lg font-bold">
                                        {current.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatQuantity(
                                            catalog,
                                            current.unit,
                                            current.quantity,
                                        )}{' '}
                                        dispo
                                    </p>
                                    {state === 'done' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="mt-1.5"
                                        >
                                            <LocationPill item={current} />
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="idle"
                                className="flex gap-2 text-4xl"
                                exit={{ opacity: 0, scale: 0.8 }}
                            >
                                {suggestions.slice(0, 4).map((item, index) => (
                                    <motion.span
                                        key={item.id}
                                        animate={{ y: [0, -6, 0] }}
                                        transition={{
                                            duration: 1.6,
                                            repeat: Infinity,
                                            delay: index * 0.18,
                                        }}
                                    >
                                        {item.displayEmoji}
                                    </motion.span>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>

            <div className="relative flex gap-2">
                {state === 'done' && current ? (
                    <>
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={spin}
                            aria-label="Autre idée"
                        >
                            <RotateCcw className="size-5" />
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => onTake(current)}
                        >
                            <HandPlatter className="size-5" /> Je le prends
                        </Button>
                    </>
                ) : (
                    <Button
                        variant="warm"
                        className="w-full"
                        disabled={
                            suggestions.length === 0 || state === 'spinning'
                        }
                        onClick={spin}
                    >
                        <Dices className="size-5" />{' '}
                        {state === 'spinning' ? 'Ça tourne…' : 'Surprends-moi'}
                    </Button>
                )}
            </div>
        </div>
    );
}
