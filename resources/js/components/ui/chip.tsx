import { motion } from 'motion/react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ChipProps = Omit<ComponentProps<typeof motion.button>, 'children'> & {
    active?: boolean;
    color?: string;
    icon?: ReactNode;
    children?: ReactNode;
};

/**
 * Selectable pill. Pass a `color` to tint it when active.
 */
export function Chip({ active = false, color, icon, children, className, style, ...props }: ChipProps) {
    return (
        <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            aria-pressed={active}
            className={cn(
                'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap transition-colors duration-200',
                active
                    ? 'border-transparent text-white shadow-[0_8px_20px_-10px_var(--chip-color)]'
                    : 'border-border bg-card/80 text-foreground/80 hover:bg-accent hover:text-foreground',
                className,
            )}
            style={{
                ...(active ? { background: color ?? 'var(--primary)' } : {}),
                ['--chip-color' as string]: color ?? 'var(--primary)',
                ...style,
            }}
            {...props}
        >
            {icon && <span className="text-base leading-none">{icon}</span>}
            {children}
        </motion.button>
    );
}
