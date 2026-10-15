import { Minus, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useRef } from 'react';
import { RollingNumber } from '@/components/ui/animated-number';
import { cn } from '@/lib/utils';

type StepperProps = {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    size?: 'md' | 'lg';
    suffix?: string;
    className?: string;
};

/**
 * Big, thumb-friendly +/− control. Holding a button repeats faster and faster.
 */
export function Stepper({ value, onChange, min = 1, max = 999, size = 'md', suffix, className }: StepperProps) {
    const timer = useRef<number | null>(null);
    const current = useRef(value);
    current.current = value;

    const step = (delta: number) => {
        const next = Math.min(max, Math.max(min, current.current + delta));

        if (next !== current.current) {
            current.current = next;
            onChange(next);
            navigator.vibrate?.(8);
        }
    };

    const startRepeat = (delta: number) => {
        step(delta);
        let delay = 380;

        const tick = () => {
            step(delta);
            delay = Math.max(60, delay * 0.8);
            timer.current = window.setTimeout(tick, delay);
        };

        timer.current = window.setTimeout(tick, delay);
    };

    const stopRepeat = () => {
        if (timer.current) {
            window.clearTimeout(timer.current);
            timer.current = null;
        }
    };

    const buttonClass = cn(
        'grid place-items-center rounded-2xl bg-card text-foreground shadow-[var(--shadow-soft)] ring-1 ring-[var(--hairline)] transition disabled:opacity-35',
        size === 'lg' ? 'size-14' : 'size-11',
    );

    return (
        <div className={cn('flex items-center gap-3', className)}>
            <motion.button
                type="button"
                whileTap={{ scale: 0.88 }}
                className={buttonClass}
                disabled={value <= min}
                onPointerDown={() => startRepeat(-1)}
                onPointerUp={stopRepeat}
                onPointerLeave={stopRepeat}
                onPointerCancel={stopRepeat}
                onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && step(-1)}
                aria-label="Diminuer"
            >
                <Minus className={size === 'lg' ? 'size-6' : 'size-5'} />
            </motion.button>

            <div className="min-w-16 flex-1 text-center">
                <RollingNumber
                    value={value}
                    className={cn('font-display font-extrabold tabular-nums', size === 'lg' ? 'text-5xl' : 'text-3xl')}
                />
                {suffix && <div className="-mt-0.5 text-xs font-medium text-muted-foreground">{suffix}</div>}
            </div>

            <motion.button
                type="button"
                whileTap={{ scale: 0.88 }}
                className={buttonClass}
                disabled={value >= max}
                onPointerDown={() => startRepeat(1)}
                onPointerUp={stopRepeat}
                onPointerLeave={stopRepeat}
                onPointerCancel={stopRepeat}
                onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && step(1)}
                aria-label="Augmenter"
            >
                <Plus className={size === 'lg' ? 'size-6' : 'size-5'} />
            </motion.button>
        </div>
    );
}
