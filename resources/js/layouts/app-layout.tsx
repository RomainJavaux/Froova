import { Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import AppLogo from '@/components/app-logo';
import { Aurora } from '@/components/fx/aurora';
import { HouseholdSwitcher } from '@/components/layout/household-switcher';
import { BottomTabBar, SidebarNav } from '@/components/layout/navigation';
import { UserMenu } from '@/components/layout/user-menu';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import items from '@/routes/items';

/**
 * Pages with their own sticky action bar, where the mobile tab bar would get in the way.
 */
const FOCUSED_PAGES = ['items/form', 'freezers/form'];

export default function AppLayout({ children }: { children: ReactNode }) {
    const { component, url } = usePage();
    const focused = FOCUSED_PAGES.includes(component);
    const pageKey = `${component}:${url.split('?')[0]}`;

    return (
        <div className="relative min-h-dvh">
            <Aurora />

            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col gap-6 border-r border-[var(--hairline)] bg-sidebar/70 p-5 backdrop-blur-2xl lg:flex">
                <Link href={dashboard()} className="px-2 pt-1">
                    <AppLogo />
                </Link>

                <HouseholdSwitcher />

                <Button
                    asChild
                    variant="warm"
                    size="lg"
                    className="w-full justify-start"
                >
                    <Link href={items.create()}>
                        <Plus className="size-5" strokeWidth={2.6} /> Ranger un
                        batch
                    </Link>
                </Button>

                <SidebarNav />

                <div className="mt-auto">
                    <UserMenu variant="row" />
                </div>
            </aside>

            {/* Mobile top bar */}
            <header className="pt-safe sticky top-0 z-30 border-b border-[var(--hairline)] bg-background/70 backdrop-blur-2xl lg:hidden">
                <div className="flex h-16 items-center justify-between gap-3 px-4">
                    <div className="min-w-0 flex-1">
                        <HouseholdSwitcher variant="compact" />
                    </div>
                    <UserMenu />
                </div>
            </header>

            <main className="lg:pl-72">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={pageKey}
                        initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{
                            opacity: 0,
                            y: -8,
                            filter: 'blur(2px)',
                            transition: { duration: 0.12 },
                        }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className={
                            focused
                                ? 'mx-auto w-full max-w-6xl px-4 pt-4 pb-36 sm:px-6 lg:px-10 lg:pt-10 lg:pb-16'
                                : 'mx-auto w-full max-w-6xl px-4 pt-4 pb-32 sm:px-6 lg:px-10 lg:pt-10 lg:pb-16'
                        }
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            {!focused && <BottomTabBar />}
        </div>
    );
}
