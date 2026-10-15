import { LayoutGroup, motion } from 'motion/react';
import { useId } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Option<T extends string> = { value: T; label: ReactNode; count?: number };

/**
 * iOS-style segmented control with a sliding highlight.
 */
export function Segmented<T extends string>({
    options,
    value,
    onChange,
    className,
    size = 'md',
}: {
    options: Option<T>[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
    size?: 'sm' | 'md';
}) {
    const id = useId();

    return (
        <LayoutGroup id={id}>
            <div
                role="tablist"
                className={cn(
                    'inline-flex rounded-2xl bg-muted/80 p-1 ring-1 ring-[var(--hairline)] ring-inset',
                    className,
                )}
            >
                {options.map((option) => {
                    const active = option.value === value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => onChange(option.value)}
                            className={cn(
                                'relative flex flex-1 items-center justify-center gap-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors',
                                size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm',
                                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {active && (
                                <motion.span
                                    layoutId="segment"
                                    className="absolute inset-0 rounded-xl bg-card shadow-[var(--shadow-soft)]"
                                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-1.5">
                                {option.label}
                                {option.count !== undefined && (
                                    <span className="rounded-full bg-foreground/8 px-1.5 text-[11px] tabular-nums">
                                        {option.count}
                                    </span>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>
        </LayoutGroup>
    );
}
