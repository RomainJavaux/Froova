import { Link } from '@inertiajs/react';
import { motion } from 'motion/react';
import AppLogo from '@/components/app-logo';
import { FreezerVisual } from '@/components/freezer/freezer-visual';
import { Aurora, Snowfall } from '@/components/fx/aurora';
import { home } from '@/routes';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="relative grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
            <Aurora />

            {/* Brand panel */}
            <div className="relative hidden overflow-hidden bg-[linear-gradient(150deg,#0ea5e9,#6366f1_55%,#8b5cf6)] p-10 text-white lg:flex lg:flex-col">
                <Snowfall count={22} />
                <div className="absolute -bottom-32 -left-20 size-[28rem] rounded-full bg-[radial-gradient(circle,rgb(255_255_255/0.18),transparent_70%)]" />
                <Link href={home()} className="relative">
                    <AppLogo className="[&_span]:text-white" />
                </Link>
                <div className="relative my-auto py-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            type: 'spring',
                            stiffness: 120,
                            damping: 20,
                        }}
                    >
                        <FreezerVisual
                            type="upright"
                            color="lilac"
                            name="Froova"
                            size="md"
                            animateOpening
                            compartments={[
                                {
                                    id: 1,
                                    name: 'Plats du soir',
                                    itemsCount: 12,
                                    previewEmojis: ['🍝', '🍛', '🥘'],
                                },
                                {
                                    id: 2,
                                    name: 'Soupes',
                                    itemsCount: 6,
                                    previewEmojis: ['🥣', '🎃'],
                                },
                                {
                                    id: 3,
                                    name: 'Viandes',
                                    itemsCount: 4,
                                    previewEmojis: ['🍗', '🥩'],
                                },
                                {
                                    id: 4,
                                    name: 'Desserts',
                                    itemsCount: 5,
                                    previewEmojis: ['🍪', '🍨'],
                                },
                            ]}
                        />
                    </motion.div>
                </div>
                <blockquote className="relative max-w-md">
                    <p className="font-display text-2xl leading-snug font-bold">
                        « Dimanche, batch cooking. Toute la semaine, on sait
                        exactement ce qu’il reste. »
                    </p>
                    <footer className="mt-3 text-sm text-white/75">
                        L’esprit Froova
                    </footer>
                </blockquote>
            </div>

            {/* Form */}
            <div className="pt-safe flex flex-col items-center justify-center px-5 py-10 sm:px-10">
                <div className="w-full max-w-[400px]">
                    <Link
                        href={home()}
                        className="mb-10 flex justify-center lg:hidden"
                    >
                        <AppLogo />
                    </Link>
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h1 className="font-display text-3xl font-extrabold">
                            {title}
                        </h1>
                        {description && (
                            <p className="mt-2 text-muted-foreground">
                                {description}
                            </p>
                        )}
                        <div className="mt-8">{children}</div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
