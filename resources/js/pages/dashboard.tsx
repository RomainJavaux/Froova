import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Fingerprint,
    Package,
    Plus,
    Snowflake,
    Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { MovementEntry } from '@/components/activity/movement-entry';
import { DinnerRoulette } from '@/components/dashboard/dinner-roulette';
import { FreezerVisual } from '@/components/freezer/freezer-visual';
import { Snowfall } from '@/components/fx/aurora';
import { LocationPill } from '@/components/items/item-row';
import {
    FreshnessRing,
    ItemAvatar,
    freshnessColor,
} from '@/components/items/item-visuals';
import { TakeSheet } from '@/components/items/take-sheet';
import { EmptyState, SectionTitle } from '@/components/page-header';
import { InstallBanner } from '@/components/pwa/install-banner';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Button } from '@/components/ui/button';
import {
    findCategory,
    findColor,
    formatQuantity,
    gradient,
    useCatalog,
} from '@/lib/catalog';
import { formatDate, greeting } from '@/lib/dates';
import { activity as activityRoute } from '@/routes';
import freezersRoutes from '@/routes/freezers';
import itemsRoutes from '@/routes/items';
import { edit as editSecurity } from '@/routes/security';
import type { Freezer, Item, Movement } from '@/types';

type Props = {
    stats: {
        items: number;
        units: number;
        soon: number;
        expired: number;
        members: number;
        addedThisMonth: number;
        takenThisMonth: number;
    };
    priority: Item[];
    suggestions: Item[];
    freezers: Freezer[];
    categories: { category: string; units: number; items: number }[];
    activity: Movement[];
    hasPasskey: boolean;
};

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
};

const rise = {
    hidden: { opacity: 0, y: 18 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring' as const, stiffness: 260, damping: 26 },
    },
};

export default function Dashboard({
    stats,
    priority,
    suggestions,
    freezers,
    categories,
    activity,
    hasPasskey,
}: Props) {
    const { auth, household } = usePage().props;
    const catalog = useCatalog();
    const [taking, setTaking] = useState<Item | null>(null);
    const palette = findColor(catalog, household?.color);
    const firstName = auth.user?.name.split(' ')[0] ?? '';
    const today = formatDate(new Date().toISOString(), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    return (
        <>
            <Head title="Accueil" />

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-8"
            >
                <motion.header variants={rise}>
                    <p className="text-sm font-semibold text-muted-foreground first-letter:uppercase">
                        {today}
                    </p>
                    <h1 className="mt-1 font-display text-[30px] leading-tight font-extrabold sm:text-4xl">
                        {greeting()} {firstName}{' '}
                        <motion.span
                            className="inline-block origin-[70%_70%]"
                            animate={{ rotate: [0, 16, -8, 16, 0] }}
                            transition={{ duration: 1.4, delay: 0.6 }}
                        >
                            👋
                        </motion.span>
                    </h1>
                </motion.header>

                <motion.div variants={rise}>
                    <InstallBanner />
                </motion.div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* Hero */}
                    <motion.section
                        variants={rise}
                        className="relative overflow-hidden rounded-[32px] p-6 text-white shadow-[var(--shadow-float)] sm:p-8 lg:col-span-2"
                        style={{ background: `${gradient(palette, 135)}` }}
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgb(255_255_255/0.3),transparent_45%),linear-gradient(160deg,rgb(15_23_42/0.12),rgb(15_23_42/0.3))]" />
                        <Snowfall count={14} className="opacity-70" />

                        <div className="relative">
                            <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
                                <Snowflake className="size-4" />{' '}
                                {household?.emoji} {household?.name}
                            </div>

                            <div className="mt-5 flex items-end gap-3">
                                <AnimatedNumber
                                    value={stats.units}
                                    className="font-display text-7xl leading-none font-extrabold tracking-tight drop-shadow-sm sm:text-8xl"
                                />
                                <div className="pb-2 text-lg leading-tight font-semibold text-white/90">
                                    {stats.units > 1 ? 'portions' : 'portion'}
                                    <br />
                                    au frais
                                </div>
                            </div>

                            <div className="mt-7 grid grid-cols-3 gap-2.5 sm:gap-3">
                                <HeroStat
                                    icon={<Package className="size-4" />}
                                    value={stats.items}
                                    label="batchs"
                                />
                                <HeroStat
                                    icon={<AlertTriangle className="size-4" />}
                                    value={stats.soon + stats.expired}
                                    label="à finir vite"
                                    alert={stats.soon + stats.expired > 0}
                                />
                                <HeroStat
                                    icon={<Users className="size-4" />}
                                    value={stats.members}
                                    label={
                                        stats.members > 1 ? 'membres' : 'membre'
                                    }
                                />
                            </div>

                            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[13px] font-medium text-white/80">
                                <span>
                                    +{stats.addedThisMonth} rangés ce mois-ci
                                </span>
                                <span>
                                    −{stats.takenThisMonth} mangés ce mois-ci
                                </span>
                            </div>
                        </div>
                    </motion.section>

                    <motion.div variants={rise}>
                        <DinnerRoulette
                            suggestions={suggestions}
                            onTake={setTaking}
                        />
                    </motion.div>
                </div>

                {!hasPasskey && (
                    <motion.div variants={rise}>
                        <Link
                            href={editSecurity()}
                            className="surface group flex items-center gap-4 p-4 transition hover:shadow-[var(--shadow-float)]"
                        >
                            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                                <Fingerprint className="size-6" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block font-display font-bold">
                                    Active la connexion express
                                </span>
                                <span className="block text-sm text-muted-foreground">
                                    Face ID, empreinte ou code du téléphone :
                                    plus besoin de mot de passe.
                                </span>
                            </span>
                            <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
                        </Link>
                    </motion.div>
                )}

                {/* Priority */}
                <motion.section variants={rise}>
                    <SectionTitle
                        title="À manger en priorité"
                        action={
                            <Link
                                href={itemsRoutes.index()}
                                className="flex items-center gap-1 text-sm font-semibold text-primary"
                            >
                                Tout voir <ArrowRight className="size-4" />
                            </Link>
                        }
                    />

                    {priority.length === 0 ? (
                        <EmptyState
                            emoji="🧊"
                            title="Le congélo est vide"
                            description="Range ton premier batch : lasagnes, soupes, sauces… on s’occupe de te dire quand les manger."
                            action={
                                <Button asChild variant="warm">
                                    <Link href={itemsRoutes.create()}>
                                        <Plus className="size-5" /> Ranger un
                                        batch
                                    </Link>
                                </Button>
                            }
                        />
                    ) : (
                        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
                            {priority.map((item, index) => (
                                <PriorityCard
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    onTake={() => setTaking(item)}
                                />
                            ))}
                        </div>
                    )}
                </motion.section>

                {/* Freezers */}
                <motion.section variants={rise}>
                    <SectionTitle
                        title="Mes congélateurs"
                        action={
                            <Link
                                href={freezersRoutes.create()}
                                className="flex items-center gap-1 text-sm font-semibold text-primary"
                            >
                                <Plus className="size-4" /> Ajouter
                            </Link>
                        }
                    />
                    <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-4">
                        {freezers.map((freezer, index) => (
                            <FreezerTile
                                key={freezer.id}
                                freezer={freezer}
                                index={index}
                            />
                        ))}
                        <Link
                            href={freezersRoutes.create()}
                            className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-[26px] border-2 border-dashed border-border p-4 text-center text-sm font-semibold text-muted-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                        >
                            <span className="grid size-12 place-items-center rounded-2xl bg-muted">
                                <Plus className="size-6" />
                            </span>
                            Nouveau congélateur
                        </Link>
                    </div>
                </motion.section>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {/* Categories */}
                    <motion.section
                        variants={rise}
                        className="surface p-5 sm:p-6"
                    >
                        <SectionTitle title="Ce qu’il y a dedans" />
                        {categories.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Rien pour l’instant.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {categories.slice(0, 7).map((row, index) => {
                                    const category = findCategory(
                                        catalog,
                                        row.category,
                                    );
                                    const max = categories[0]?.units || 1;

                                    return (
                                        <li
                                            key={row.category}
                                            className="flex items-center gap-3"
                                        >
                                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-xl">
                                                {category?.emoji}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1 flex justify-between text-sm">
                                                    <span className="truncate font-semibold">
                                                        {category?.label}
                                                    </span>
                                                    <span className="text-muted-foreground tabular-nums">
                                                        {row.units}
                                                    </span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            background:
                                                                category?.color,
                                                        }}
                                                        initial={{ width: 0 }}
                                                        animate={{
                                                            width: `${(row.units / max) * 100}%`,
                                                        }}
                                                        transition={{
                                                            duration: 0.9,
                                                            delay:
                                                                0.3 +
                                                                index * 0.06,
                                                            ease: [
                                                                0.16, 1, 0.3, 1,
                                                            ],
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </motion.section>

                    {/* Activity */}
                    <motion.section
                        variants={rise}
                        className="surface p-5 sm:p-6"
                    >
                        <SectionTitle
                            title="Activité récente"
                            action={
                                <Link
                                    href={activityRoute()}
                                    className="flex items-center gap-1 text-sm font-semibold text-primary"
                                >
                                    Historique <ArrowRight className="size-4" />
                                </Link>
                            }
                        />
                        {activity.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Aucune activité pour le moment.
                            </p>
                        ) : (
                            <ul className="space-y-4">
                                {activity.map((movement, index) => (
                                    <MovementEntry
                                        key={movement.id}
                                        movement={movement}
                                        index={index}
                                        compact
                                    />
                                ))}
                            </ul>
                        )}
                    </motion.section>
                </div>
            </motion.div>

            <TakeSheet
                item={taking}
                open={taking !== null}
                onOpenChange={(open) => !open && setTaking(null)}
            />
        </>
    );
}

function HeroStat({
    icon,
    value,
    label,
    alert = false,
}: {
    icon: React.ReactNode;
    value: number;
    label: string;
    alert?: boolean;
}) {
    return (
        <div className="rounded-2xl bg-white/16 p-3 ring-1 ring-white/25 backdrop-blur-md sm:p-4">
            <div className="flex items-center gap-1.5 text-white/80">
                {icon}
                {alert && (
                    <span className="size-1.5 animate-pulse rounded-full bg-amber-300" />
                )}
            </div>
            <AnimatedNumber
                value={value}
                className="mt-1 block font-display text-2xl font-extrabold sm:text-3xl"
            />
            <div className="text-xs font-medium text-white/80 sm:text-[13px]">
                {label}
            </div>
        </div>
    );
}

function PriorityCard({
    item,
    index,
    onTake,
}: {
    item: Item;
    index: number;
    onTake: () => void;
}) {
    const catalog = useCatalog();
    const days = item.freshness.daysLeft;

    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
                delay: 0.15 + index * 0.05,
                type: 'spring',
                stiffness: 260,
                damping: 26,
            }}
            className="surface w-[230px] shrink-0 snap-start overflow-hidden p-0"
        >
            <Link href={itemsRoutes.show(item.id)} className="block">
                <div className="relative">
                    <ItemAvatar
                        item={item}
                        size="xl"
                        className="h-32 w-full rounded-none text-6xl"
                    />
                    <div className="absolute top-3 right-3 rounded-full bg-card/90 p-1 shadow-md backdrop-blur">
                        <FreshnessRing
                            freshness={item.freshness}
                            size={46}
                            stroke={4}
                        >
                            <span className="text-center leading-none">
                                <span
                                    className="block text-[13px] font-extrabold"
                                    style={{
                                        color: freshnessColor(item.freshness),
                                    }}
                                >
                                    {days === null
                                        ? '∞'
                                        : Math.abs(days) > 99
                                          ? '99+'
                                          : Math.abs(days)}
                                </span>
                                <span className="block text-[8px] font-semibold text-muted-foreground">
                                    {days !== null && days < 0
                                        ? 'j retard'
                                        : 'jours'}
                                </span>
                            </span>
                        </FreshnessRing>
                    </div>
                </div>
                <div className="px-4 pt-3">
                    <h3 className="truncate font-bold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                        {formatQuantity(catalog, item.unit, item.quantity)}
                    </p>
                </div>
            </Link>
            <div className="flex items-center gap-2 px-4 pt-2 pb-4">
                <LocationPill item={item} className="min-w-0 flex-1" />
                <Button
                    size="icon-sm"
                    variant="secondary"
                    onClick={onTake}
                    aria-label="Je prends"
                >
                    🍽️
                </Button>
            </div>
        </motion.div>
    );
}

function FreezerTile({ freezer, index }: { freezer: Freezer; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.06 }}
            whileHover={{ y: -4 }}
        >
            <Link
                href={freezersRoutes.show(freezer.id)}
                className="surface flex h-full flex-col items-center gap-3 p-4 pb-5"
            >
                <div className="flex min-h-44 w-full flex-1 items-center justify-center">
                    <FreezerVisual
                        type={freezer.type}
                        color={freezer.color}
                        name={freezer.name}
                        compartments={freezer.compartments.map(
                            (compartment) => ({
                                ...compartment,
                                previewEmojis: [],
                            }),
                        )}
                        size="sm"
                        className="origin-center scale-[0.95]"
                    />
                </div>
                <div className="w-full text-center">
                    <p className="truncate font-display font-bold">
                        {freezer.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {freezer.stats.units} portions ·{' '}
                        {freezer.compartments.length}{' '}
                        {freezer.type === 'chest' ? 'paniers' : 'tiroirs'}
                    </p>
                </div>
            </Link>
        </motion.div>
    );
}
