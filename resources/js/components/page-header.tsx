import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
    title,
    eyebrow,
    description,
    actions,
    back,
    className,
}: {
    title: ReactNode;
    eyebrow?: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    back?: NonNullable<InertiaLinkProps['href']>;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-8',
                className,
            )}
        >
            <div className="min-w-0">
                {back && (
                    <Link
                        href={back}
                        className="mb-3 -ml-1.5 inline-flex items-center gap-1 rounded-full py-1 pr-3 pl-1.5 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    >
                        <ChevronLeft className="size-4" /> Retour
                    </Link>
                )}
                {eyebrow && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-1 text-sm font-semibold text-primary"
                    >
                        {eyebrow}
                    </motion.div>
                )}
                <h1 className="font-display text-[28px] leading-[1.1] font-extrabold sm:text-4xl">
                    {title}
                </h1>
                {description && (
                    <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}

export function SectionTitle({
    title,
    action,
    className,
}: {
    title: ReactNode;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'mb-3 flex items-center justify-between gap-3',
                className,
            )}
        >
            <h2 className="font-display text-lg font-bold">{title}</h2>
            {action}
        </div>
    );
}

export function EmptyState({
    emoji,
    title,
    description,
    action,
    className,
}: {
    emoji: string;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                'surface flex flex-col items-center px-6 py-12 text-center',
                className,
            )}
        >
            <motion.div
                className="mb-4 text-6xl"
                animate={{ y: [0, -8, 0], rotate: [0, -4, 4, 0] }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                {emoji}
            </motion.div>
            <h3 className="font-display text-xl font-bold">{title}</h3>
            {description && (
                <p className="mt-2 max-w-sm text-[15px] text-muted-foreground">
                    {description}
                </p>
            )}
            {action && <div className="mt-6">{action}</div>}
        </motion.div>
    );
}
