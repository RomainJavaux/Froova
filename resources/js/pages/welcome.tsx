import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Fingerprint,
    MapPin,
    Search,
    Smartphone,
    Sparkles,
    Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import AppLogo from '@/components/app-logo';
import { FreezerVisual } from '@/components/freezer/freezer-visual';
import { Aurora } from '@/components/fx/aurora';
import { Button } from '@/components/ui/button';
import { login, register } from '@/routes';

const FEATURES = [
    {
        emoji: '🧊',
        title: 'Tes vrais tiroirs',
        text: 'Armoire, coffre, combiné : dessine ton congélo et touche un tiroir pour l’ouvrir.',
    },
    {
        emoji: '🍝',
        title: 'Pensé batch cooking',
        text: '10 lasagnes ? Une photo, la quantité, la date : rangé en 15 secondes.',
    },
    {
        emoji: '📍',
        title: '« Il est où ? »',
        text: 'Cherche un plat et l’app t’ouvre directement le bon tiroir.',
    },
    {
        emoji: '⏳',
        title: 'Zéro gaspi',
        text: 'Dates limites calculées, alertes « à manger vite » et idées repas.',
    },
    {
        emoji: '👨‍👩‍👧',
        title: 'En famille',
        text: 'Invite tes proches par lien ou QR code : tout le monde voit le même stock.',
    },
    {
        emoji: '📲',
        title: 'Comme une vraie app',
        text: 'Installe-la sur ton téléphone et reste connecté, avec Face ID ou empreinte.',
    },
];

const fade = {
    hidden: { opacity: 0, y: 24 },
    show: (index: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: 0.1 + index * 0.08,
            type: 'spring' as const,
            stiffness: 200,
            damping: 24,
        },
    }),
};

export default function Welcome() {
    return (
        <div className="relative min-h-dvh overflow-x-hidden">
            <Head title="Ton congélo, enfin rangé" />
            <Aurora />

            <header className="pt-safe mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
                <AppLogo />
                <nav className="flex items-center gap-2">
                    <Button asChild variant="ghost" size="sm">
                        <Link href={login()}>Se connecter</Link>
                    </Button>
                    <Button asChild size="sm" className="hidden sm:inline-flex">
                        <Link href={register()}>Créer un compte</Link>
                    </Button>
                </nav>
            </header>

            <main className="mx-auto max-w-6xl px-5">
                {/* Hero */}
                <section className="grid items-center gap-12 pt-8 pb-20 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
                    <motion.div
                        initial="hidden"
                        animate="show"
                        className="text-center lg:text-left"
                    >
                        <motion.span
                            variants={fade}
                            custom={0}
                            className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold"
                        >
                            <Sparkles className="size-4 text-primary" /> Batch
                            cooking · Famille · Anti-gaspi
                        </motion.span>
                        <motion.h1
                            variants={fade}
                            custom={1}
                            className="mt-6 font-display text-5xl leading-[1.02] font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
                        >
                            Ton congélo,
                            <br />
                            <span className="bg-[linear-gradient(120deg,#38bdf8,#6366f1_50%,#a855f7)] bg-clip-text text-transparent">
                                enfin rangé.
                            </span>
                        </motion.h1>
                        <motion.p
                            variants={fade}
                            custom={2}
                            className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground lg:mx-0"
                        >
                            Froova te montre ce qu’il y a dans chaque tiroir, te
                            dit quoi manger en premier et partage tout ça avec
                            ta famille. Fini les boîtes mystère au fond du
                            coffre.
                        </motion.p>
                        <motion.div
                            variants={fade}
                            custom={3}
                            className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
                        >
                            <Button asChild size="lg" variant="warm">
                                <Link href={register()}>
                                    Commencer gratuitement{' '}
                                    <ArrowRight className="size-5" />
                                </Link>
                            </Button>
                            <Button asChild size="lg" variant="outline">
                                <Link href={login()}>
                                    <Fingerprint className="size-5" /> J’ai déjà
                                    un compte
                                </Link>
                            </Button>
                        </motion.div>
                    </motion.div>

                    <div className="relative mx-auto w-full max-w-md">
                        <div className="absolute inset-10 -z-10 rounded-full bg-[radial-gradient(circle,rgb(99_102_241/0.4),transparent_70%)]" />
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                type: 'spring',
                                stiffness: 120,
                                damping: 20,
                            }}
                        >
                            <FreezerVisual
                                type="upright"
                                color="frost"
                                name="Congel cuisine"
                                size="lg"
                                animateOpening
                                selectedId={2}
                                compartments={[
                                    {
                                        id: 1,
                                        name: 'Plats du soir',
                                        itemsCount: 14,
                                        previewEmojis: ['🍝', '🍛', '🥘', '🍲'],
                                    },
                                    {
                                        id: 2,
                                        name: 'Soupes & sauces',
                                        itemsCount: 9,
                                        expiringCount: 2,
                                        previewEmojis: ['🥣', '🎃', '🍅'],
                                    },
                                    {
                                        id: 3,
                                        name: 'Viandes & poissons',
                                        itemsCount: 7,
                                        previewEmojis: ['🍗', '🐟'],
                                    },
                                    {
                                        id: 4,
                                        name: 'Légumes',
                                        itemsCount: 5,
                                        previewEmojis: ['🥦', '🫛'],
                                    },
                                    {
                                        id: 5,
                                        name: 'Desserts',
                                        itemsCount: 6,
                                        previewEmojis: ['🍪', '🍨'],
                                    },
                                ]}
                            />
                        </motion.div>

                        <FloatingCard
                            className="top-24 -left-4 sm:-left-16"
                            delay={1.4}
                        >
                            <span className="text-2xl">🍝</span>
                            <div>
                                <p className="text-sm font-bold">Lasagnes ×8</p>
                                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="size-3" /> Tiroir 1
                                </p>
                            </div>
                        </FloatingCard>
                        <FloatingCard
                            className="-right-3 bottom-28 sm:-right-12"
                            delay={1.8}
                        >
                            <span className="relative flex size-2.5">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-70" />
                                <span className="relative inline-flex size-2.5 rounded-full bg-amber-400" />
                            </span>
                            <p className="text-sm font-bold">
                                Velouté : à manger sous 3 j
                            </p>
                        </FloatingCard>
                    </div>
                </section>

                {/* Features */}
                <section className="pb-20">
                    <h2 className="text-center font-display text-3xl font-extrabold sm:text-4xl">
                        Tout ce qu’il faut, rien de plus
                    </h2>
                    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {FEATURES.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{
                                    delay: index * 0.06,
                                    type: 'spring',
                                    stiffness: 200,
                                    damping: 24,
                                }}
                                whileHover={{ y: -4 }}
                                className="glass rounded-[28px] p-6"
                            >
                                <div className="text-4xl">{feature.emoji}</div>
                                <h3 className="mt-4 font-display text-xl font-bold">
                                    {feature.title}
                                </h3>
                                <p className="mt-2 text-muted-foreground">
                                    {feature.text}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Steps */}
                <section className="pb-24">
                    <div className="relative overflow-hidden rounded-[40px] bg-[linear-gradient(135deg,#0ea5e9,#6366f1_55%,#8b5cf6)] p-8 text-white shadow-[var(--shadow-float)] sm:p-12">
                        <div className="absolute -top-20 -right-20 size-72 rounded-full bg-[radial-gradient(circle,rgb(255_255_255/0.25),transparent_70%)]" />
                        <h2 className="relative font-display text-3xl font-extrabold sm:text-4xl">
                            Prêt en 2 minutes
                        </h2>
                        <div className="relative mt-8 grid gap-6 sm:grid-cols-3">
                            {[
                                {
                                    icon: <Users className="size-6" />,
                                    title: 'Crée ton lieu',
                                    text: 'Et invite la famille.',
                                },
                                {
                                    icon: <Search className="size-6" />,
                                    title: 'Dessine ton congélo',
                                    text: 'Type, tiroirs, couleurs.',
                                },
                                {
                                    icon: <Smartphone className="size-6" />,
                                    title: 'Range & mange',
                                    text: 'Depuis ton téléphone.',
                                },
                            ].map((step, index) => (
                                <div
                                    key={step.title}
                                    className="flex items-start gap-4"
                                >
                                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur">
                                        {step.icon}
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-white/70">
                                            Étape {index + 1}
                                        </p>
                                        <p className="font-display text-lg font-bold">
                                            {step.title}
                                        </p>
                                        <p className="text-white/80">
                                            {step.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button
                            asChild
                            size="lg"
                            className="relative mt-10 bg-white text-indigo-600 shadow-none hover:bg-white/90"
                        >
                            <Link href={register()}>
                                Créer mon compte{' '}
                                <ArrowRight className="size-5" />
                            </Link>
                        </Button>
                    </div>
                </section>
            </main>

            <footer className="pb-safe mx-auto max-w-6xl px-5 py-8 text-center text-sm text-muted-foreground">
                ❄️ Froova — garde la fraîcheur, pas le désordre.
            </footer>
        </div>
    );
}

function FloatingCard({
    children,
    className,
    delay,
}: {
    children: React.ReactNode;
    className?: string;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
            transition={{
                opacity: { delay },
                scale: { delay, type: 'spring' },
                y: {
                    delay: delay + 0.4,
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                },
            }}
            className={`glass-strong absolute z-30 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-[var(--shadow-float)] ${className ?? ''}`}
        >
            {children}
        </motion.div>
    );
}
