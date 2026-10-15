import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const BLOBS = [
    {
        color: 'var(--aurora-1)',
        className: 'left-[-10%] top-[-12%] size-[55vmax]',
        x: [0, 60, -20, 0],
        y: [0, 40, 80, 0],
    },
    {
        color: 'var(--aurora-2)',
        className: 'right-[-15%] top-[5%] size-[45vmax]',
        x: [0, -50, 20, 0],
        y: [0, 60, -30, 0],
    },
    {
        color: 'var(--aurora-3)',
        className: 'bottom-[-20%] left-[15%] size-[50vmax]',
        x: [0, 40, -40, 0],
        y: [0, -50, 10, 0],
    },
    {
        color: 'var(--aurora-4)',
        className: 'bottom-[-10%] right-[0%] size-[35vmax]',
        x: [0, -30, 30, 0],
        y: [0, -20, 30, 0],
    },
];

/**
 * Slowly drifting, blurred color fields behind the app.
 */
export function Aurora({ className }: { className?: string }) {
    return (
        <div
            aria-hidden
            className={cn(
                'pointer-events-none fixed inset-0 -z-10 overflow-hidden',
                className,
            )}
        >
            {BLOBS.map((blob, index) => (
                <motion.div
                    key={index}
                    className={cn(
                        'absolute rounded-full will-change-transform',
                        blob.className,
                    )}
                    style={{
                        // A soft radial falloff instead of a CSS blur keeps scrolling smooth on phones.
                        background: `radial-gradient(circle at center, ${blob.color}, transparent 68%)`,
                    }}
                    animate={{ x: blob.x, y: blob.y }}
                    transition={{
                        duration: 28 + index * 6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
            <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.5)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent_70%)] [background-size:22px_22px] opacity-40 dark:opacity-[0.06]" />
        </div>
    );
}

/**
 * Gentle falling snowflakes for hero areas.
 */
export function Snowfall({
    count = 18,
    className,
}: {
    count?: number;
    className?: string;
}) {
    // Deterministic pseudo-random values so server and client renders match.
    const noise = (index: number, salt: number) => {
        const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;

        return value - Math.floor(value);
    };

    const flakes = Array.from({ length: count }, (_, index) => ({
        left: `${(index / count) * 100 + noise(index, 1) * (100 / count)}%`,
        size: 7 + Math.round(noise(index, 2) * 9),
        duration: 10 + noise(index, 3) * 10,
        delay: -noise(index, 4) * 20,
        drift: `${Math.round(noise(index, 5) * 60 - 30)}px`,
        opacity: 0.3 + noise(index, 6) * 0.5,
    }));

    return (
        <div
            aria-hidden
            className={cn(
                'pointer-events-none absolute inset-0 overflow-hidden',
                className,
            )}
        >
            {flakes.map((flake, index) => (
                <span
                    key={index}
                    className="absolute top-0 animate-snow text-white select-none"
                    style={
                        {
                            left: flake.left,
                            fontSize: flake.size,
                            opacity: flake.opacity,
                            animationDuration: `${flake.duration}s`,
                            animationDelay: `${flake.delay}s`,
                            '--drift': flake.drift,
                        } as React.CSSProperties
                    }
                >
                    {'❄︎'}
                </span>
            ))}
        </div>
    );
}
