import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { gradient } from '@/lib/catalog';
import { cn } from '@/lib/utils';
import type { PaletteColor } from '@/types';

export const FOOD_EMOJIS = [
    '🍲', '🍝', '🍛', '🥘', '🍜', '🥣', '🍕', '🥧', '🌮', '🌯', '🥙', '🍔',
    '🍗', '🥩', '🍖', '🥓', '🐟', '🦐', '🍤', '🦑', '🥚', '🧆', '🥟', '🥠',
    '🥦', '🥕', '🌽', '🫛', '🥬', '🍅', '🧅', '🍄', '🥔', '🎃', '🫑', '🌶️',
    '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🍌', '🍋', '🍎', '🍐', '🥝', '🍇',
    '🥖', '🥐', '🍞', '🧇', '🥞', '🍪', '🍰', '🧁', '🍨', '🍦', '🍫', '🍮',
    '🫙', '🧈', '🧀', '🍚', '🍙', '🌿', '🍼', '🧊', '📦', '❤️', '⭐', '🎉',
];

export const PLACE_EMOJIS = ['🏠', '🏡', '🏢', '🏘️', '🏔️', '🏖️', '🌲', '🏰', '🛖', '⛺', '🚐', '❄️'];

export function EmojiGrid({
    emojis = FOOD_EMOJIS,
    value,
    onChange,
    className,
}: {
    emojis?: string[];
    value: string | null;
    onChange: (emoji: string) => void;
    className?: string;
}) {
    return (
        <div className={cn('grid grid-cols-6 gap-1.5 sm:grid-cols-8', className)}>
            {emojis.map((emoji) => (
                <motion.button
                    key={emoji}
                    type="button"
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.12, rotate: -4 }}
                    onClick={() => onChange(emoji)}
                    className={cn(
                        'grid aspect-square place-items-center rounded-2xl text-2xl transition-colors',
                        value === emoji ? 'bg-primary/15 ring-2 ring-primary' : 'hover:bg-accent',
                    )}
                >
                    {emoji}
                </motion.button>
            ))}
        </div>
    );
}

export function ColorSwatches({
    colors,
    value,
    onChange,
    className,
}: {
    colors: PaletteColor[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
}) {
    return (
        <div className={cn('flex flex-wrap gap-2.5', className)}>
            {colors.map((color) => {
                const active = color.value === value;

                return (
                    <motion.button
                        key={color.value}
                        type="button"
                        title={color.label}
                        aria-label={color.label}
                        aria-pressed={active}
                        whileTap={{ scale: 0.85 }}
                        whileHover={{ y: -2 }}
                        onClick={() => onChange(color.value)}
                        className={cn(
                            'relative grid size-11 place-items-center rounded-full shadow-[var(--shadow-soft)] ring-offset-2 ring-offset-background transition',
                            active && 'ring-2 ring-foreground/70',
                        )}
                        style={{ background: gradient(color) }}
                    >
                        {active && (
                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                <Check className="size-5 text-white drop-shadow" strokeWidth={3} />
                            </motion.span>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}
