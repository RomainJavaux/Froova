import { Link, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    History,
    House,
    ListChecks,
    Plus,
    Refrigerator,
    Search,
    Snowflake,
    Users,
    X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { activity, dashboard } from '@/routes';
import freezers from '@/routes/freezers';
import household from '@/routes/household';
import items from '@/routes/items';

type NavEntry = {
    title: string;
    short: string;
    href: string;
    icon: LucideIcon;
    match: (url: string) => boolean;
};

export const NAV: NavEntry[] = [
    {
        title: 'Accueil',
        short: 'Accueil',
        href: dashboard.url(),
        icon: House,
        match: (url) => url.startsWith('/dashboard'),
    },
    {
        title: 'Congélateurs',
        short: 'Congels',
        href: freezers.index.url(),
        icon: Refrigerator,
        match: (url) => url.startsWith('/freezers'),
    },
    {
        title: 'Inventaire',
        short: 'Inventaire',
        href: items.index.url(),
        icon: ListChecks,
        match: (url) =>
            url.startsWith('/items') && !url.startsWith('/items/create'),
    },
    {
        title: 'Activité',
        short: 'Activité',
        href: activity.url(),
        icon: History,
        match: (url) => url.startsWith('/activity'),
    },
    {
        title: 'Mon foyer',
        short: 'Foyer',
        href: household.show.url(),
        icon: Users,
        match: (url) => url.startsWith('/household'),
    },
];

export function SidebarNav() {
    const { url } = usePage();

    return (
        <nav className="flex flex-col gap-1">
            {NAV.map((entry) => {
                const active = entry.match(url);

                return (
                    <Link
                        key={entry.href}
                        href={entry.href}
                        prefetch
                        className={cn(
                            'relative flex h-11 items-center gap-3 rounded-2xl px-3.5 text-[14.5px] font-semibold transition-colors',
                            active
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                        )}
                    >
                        {active && (
                            <motion.span
                                layoutId="sidebar-active"
                                className="absolute inset-0 rounded-2xl bg-card shadow-[var(--shadow-soft)] ring-1 ring-[var(--hairline)]"
                                transition={{
                                    type: 'spring',
                                    stiffness: 500,
                                    damping: 40,
                                }}
                            />
                        )}
                        <entry.icon
                            className={cn(
                                'relative size-[19px]',
                                active && 'text-primary',
                            )}
                            strokeWidth={active ? 2.4 : 2}
                        />
                        <span className="relative">{entry.title}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

const MOBILE_TABS = [NAV[0], NAV[1], NAV[2], NAV[4]];

export function BottomTabBar() {
    const { url } = usePage();
    const [menuOpen, setMenuOpen] = useState(false);

    const tab = (entry: NavEntry) => {
        const active = entry.match(url);

        return (
            <Link
                key={entry.href}
                href={entry.href}
                prefetch
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
                aria-current={active ? 'page' : undefined}
            >
                {active && (
                    <motion.span
                        layoutId="tab-active"
                        className="absolute inset-x-2 inset-y-1 rounded-2xl bg-primary/10"
                        transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 38,
                        }}
                    />
                )}
                <motion.span
                    animate={{ y: active ? -1 : 0, scale: active ? 1.08 : 1 }}
                    className="relative"
                >
                    <entry.icon
                        className={cn(
                            'size-[22px]',
                            active ? 'text-primary' : 'text-muted-foreground',
                        )}
                        strokeWidth={active ? 2.4 : 2}
                    />
                </motion.span>
                <span
                    className={cn(
                        'relative text-[10.5px] font-semibold',
                        active ? 'text-primary' : 'text-muted-foreground',
                    )}
                >
                    {entry.short}
                </span>
            </Link>
        );
    };

    return (
        <>
            <div className="pb-safe pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 lg:hidden">
                <nav className="glass-strong pointer-events-auto mx-auto flex max-w-md items-center rounded-[26px] px-1.5 shadow-[var(--shadow-float)]">
                    {tab(MOBILE_TABS[0])}
                    {tab(MOBILE_TABS[1])}

                    <div className="flex flex-1 justify-center">
                        <motion.button
                            type="button"
                            onClick={() => setMenuOpen((open) => !open)}
                            whileTap={{ scale: 0.9 }}
                            animate={{ rotate: menuOpen ? 45 : 0 }}
                            transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 22,
                            }}
                            className="-mt-7 grid size-[58px] place-items-center rounded-[22px] bg-[linear-gradient(135deg,oklch(0.78_0.15_60),var(--warm))] text-white shadow-[0_14px_30px_-8px_color-mix(in_oklab,var(--warm)_80%,transparent)] ring-4 ring-background"
                            aria-label="Ajouter"
                            aria-expanded={menuOpen}
                        >
                            <Plus className="size-7" strokeWidth={2.6} />
                        </motion.button>
                    </div>

                    {tab(MOBILE_TABS[2])}
                    {tab(MOBILE_TABS[3])}
                </nav>
            </div>

            <QuickActions open={menuOpen} onClose={() => setMenuOpen(false)} />
        </>
    );
}

const QUICK_ACTIONS = [
    {
        title: 'Ranger un batch',
        description: 'Ajouter des plats au congélo',
        icon: Snowflake,
        href: items.create.url(),
        tint: 'from-sky-400 to-indigo-500',
    },
    {
        title: 'Prendre quelque chose',
        description: 'Chercher et sortir un plat',
        icon: Search,
        href: items.index.url({ query: { focus: 1 } }),
        tint: 'from-amber-400 to-orange-500',
    },
    {
        title: 'Nouveau congélateur',
        description: 'Configurer un appareil',
        icon: Refrigerator,
        href: freezers.create.url(),
        tint: 'from-emerald-400 to-teal-500',
    },
];

function QuickActions({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-30 flex flex-col justify-end bg-slate-950/35 px-4 pb-32 backdrop-blur-md lg:hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
                        {QUICK_ACTIONS.map((action, index) => (
                            <motion.div
                                key={action.title}
                                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{
                                    opacity: 0,
                                    y: 30,
                                    scale: 0.92,
                                    transition: {
                                        delay:
                                            (QUICK_ACTIONS.length - index) *
                                            0.03,
                                    },
                                }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 420,
                                    damping: 30,
                                    delay:
                                        (QUICK_ACTIONS.length - 1 - index) *
                                        0.05,
                                }}
                            >
                                <Link
                                    href={action.href}
                                    onClick={onClose}
                                    className="glass-strong flex items-center gap-4 rounded-3xl p-3.5 shadow-[var(--shadow-float)] active:scale-[0.98]"
                                >
                                    <span
                                        className={cn(
                                            'grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
                                            action.tint,
                                        )}
                                    >
                                        <action.icon className="size-6" />
                                    </span>
                                    <span className="flex-1">
                                        <span className="block font-display text-base font-bold">
                                            {action.title}
                                        </span>
                                        <span className="block text-sm text-muted-foreground">
                                            {action.description}
                                        </span>
                                    </span>
                                </Link>
                            </motion.div>
                        ))}
                        <motion.button
                            type="button"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="mx-auto mt-1 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white/90"
                            onClick={onClose}
                        >
                            <X className="size-4" /> Fermer
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
