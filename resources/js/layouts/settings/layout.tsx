import { Link } from '@inertiajs/react';
import { Palette, ShieldCheck, UserRound } from 'lucide-react';
import { motion } from 'motion/react';
import type { PropsWithChildren } from 'react';
import { PageHeader } from '@/components/page-header';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';

const NAV = [
    { title: 'Profil', href: edit(), icon: UserRound },
    { title: 'Sécurité', href: editSecurity(), icon: ShieldCheck },
    { title: 'Apparence', href: editAppearance(), icon: Palette },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div>
            <PageHeader eyebrow="Mon compte" title="Réglages" />

            <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
                <aside className="lg:w-56">
                    <nav
                        className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0"
                        aria-label="Réglages"
                    >
                        {NAV.map((item) => {
                            const active = isCurrentOrParentUrl(item.href);

                            return (
                                <Link
                                    key={toUrl(item.href)}
                                    href={item.href}
                                    className={cn(
                                        'relative flex h-11 shrink-0 items-center gap-2.5 rounded-2xl px-4 text-sm font-semibold transition-colors',
                                        active
                                            ? 'text-foreground'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {active && (
                                        <motion.span
                                            layoutId="settings-active"
                                            className="absolute inset-0 rounded-2xl bg-card shadow-[var(--shadow-soft)] ring-1 ring-[var(--hairline)]"
                                        />
                                    )}
                                    <item.icon className="relative size-4" />
                                    <span className="relative">
                                        {item.title}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <div className="min-w-0 flex-1 lg:max-w-2xl">
                    <section className="space-y-10">{children}</section>
                </div>
            </div>
        </div>
    );
}
