import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Toggle switch. Renders a hidden input so it also works inside plain <Form> submissions.
 */
export function Switch({
    checked,
    onCheckedChange,
    name,
    id,
    className,
}: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    name?: string;
    id?: string;
    className?: string;
}) {
    return (
        <>
            {name && <input type="hidden" name={name} value={checked ? '1' : '0'} />}
            <button
                id={id}
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onCheckedChange(!checked)}
                className={cn(
                    'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:outline-none',
                    checked ? 'bg-primary' : 'bg-muted-foreground/25',
                    className,
                )}
            >
                <motion.span
                    layout
                    transition={{ type: 'spring', stiffness: 600, damping: 32 }}
                    className={cn('size-6 rounded-full bg-white shadow-md', checked ? 'ml-auto' : 'ml-0')}
                />
            </button>
        </>
    );
}
