import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRightLeft,
    CalendarDays,
    ChefHat,
    HandPlatter,
    MapPin,
    MoreHorizontal,
    Pencil,
    PlusCircle,
    QrCode,
    RotateCcw,
    Scale,
    Snowflake,
    Trash2,
    UserRound,
    Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { MovementEntry } from '@/components/activity/movement-entry';
import { FreezerVisual } from '@/components/freezer/freezer-visual';
import {
    DiscardSheet,
    LabelSheet,
    MoveSheet,
    RestockSheet,
} from '@/components/items/item-sheets';
import {
    FreshnessBadge,
    FreshnessRing,
    ItemAvatar,
    QuantityBar,
    freshnessColor,
} from '@/components/items/item-visuals';
import { PhotoHero } from '@/components/items/photo-hero';
import { PreparationCard } from '@/components/items/preparation-card';
import { TakeSheet } from '@/components/items/take-sheet';
import { PageHeader } from '@/components/page-header';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    findCategory,
    formatQuantity,
    unitWord,
    useCatalog,
} from '@/lib/catalog';
import { formatDate, freshnessLabel } from '@/lib/dates';
import { cn } from '@/lib/utils';
import freezersRoutes from '@/routes/freezers';
import itemsRoutes from '@/routes/items';
import type { FreezerOption, Item, Movement } from '@/types';

type Sheet =
    | 'take'
    | 'restock'
    | 'move'
    | 'discard'
    | 'label'
    | 'delete'
    | null;

export default function ItemShow({
    item,
    movements,
    freezers,
}: {
    item: Item;
    movements: Movement[];
    freezers: FreezerOption[];
}) {
    const catalog = useCatalog();
    const [sheet, setSheet] = useState<Sheet>(null);
    const category = findCategory(catalog, item.category);
    const finished = item.quantity === 0;
    const freezer = freezers.find(
        (candidate) => candidate.id === item.location?.freezerId,
    );

    const close = (open: boolean) => !open && setSheet(null);

    const heroOverlay = (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/55 to-transparent p-5 pt-16 text-white">
            <span className="rounded-full bg-white/90 shadow-sm backdrop-blur dark:bg-slate-900/85">
                <FreshnessBadge freshness={item.freshness} />
            </span>
            {item.tags.length > 0 && (
                <div className="flex flex-wrap justify-end gap-1">
                    {item.tags.map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <>
            <Head title={item.name} />

            <PageHeader
                back={itemsRoutes.index()}
                eyebrow={
                    <span>
                        {category?.emoji} {category?.label}
                    </span>
                }
                title={item.name}
                actions={
                    <>
                        <Button
                            asChild
                            variant="outline"
                            size="icon"
                            aria-label="Modifier"
                        >
                            <Link href={itemsRoutes.edit(item.id)}>
                                <Pencil className="size-5" />
                            </Link>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label="Plus d’actions"
                                >
                                    <MoreHorizontal className="size-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60">
                                <DropdownMenuItem
                                    onSelect={() => setSheet('label')}
                                >
                                    <QrCode /> Étiquette & QR code
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={itemsRoutes.create({
                                            query: { from: item.id },
                                        })}
                                    >
                                        <RotateCcw /> Refaire ce batch
                                    </Link>
                                </DropdownMenuItem>
                                {!finished && (
                                    <DropdownMenuItem
                                        onSelect={() => setSheet('discard')}
                                    >
                                        <Trash2 /> Jeter
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={() => setSheet('delete')}
                                >
                                    <Trash2 /> Supprimer définitivement
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                }
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
                <div className="space-y-6">
                    {/* Hero */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative overflow-hidden rounded-[32px] shadow-[var(--shadow-float)]"
                    >
                        {item.photoUrl ? (
                            <PhotoHero src={item.photoUrl} alt={item.name}>
                                {heroOverlay}
                            </PhotoHero>
                        ) : (
                            <>
                                <ItemAvatar
                                    item={item}
                                    size="xl"
                                    className="aspect-[16/10] h-auto w-full rounded-none text-[110px] sm:aspect-[16/8]"
                                />
                                {heroOverlay}
                            </>
                        )}
                    </motion.div>

                    {!finished && (
                        <StockActions className="lg:hidden" onOpen={setSheet} />
                    )}

                    {finished && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-start gap-3 rounded-3xl bg-[color-mix(in_oklab,var(--warm)_14%,var(--card))] p-5 sm:flex-row sm:items-center"
                        >
                            <span className="text-4xl">🍽️</span>
                            <div className="flex-1">
                                <p className="font-display text-lg font-bold">
                                    Ce batch est terminé
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Il était bon ? Refais-le en un geste avec
                                    les mêmes infos.
                                </p>
                            </div>
                            <Button asChild variant="warm">
                                <Link
                                    href={itemsRoutes.create({
                                        query: { from: item.id },
                                    })}
                                >
                                    <RotateCcw className="size-4" /> Refaire
                                </Link>
                            </Button>
                        </motion.div>
                    )}

                    {/* Quantity + freshness */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="surface p-5">
                            <p className="text-sm font-semibold text-muted-foreground">
                                Il reste
                            </p>
                            <div className="mt-1 flex items-baseline gap-2">
                                <motion.span
                                    key={item.quantity}
                                    initial={{ y: -12, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="font-display text-5xl font-extrabold tabular-nums"
                                >
                                    {item.quantity}
                                </motion.span>
                                <span className="text-lg font-semibold text-muted-foreground">
                                    {unitWord(
                                        catalog,
                                        item.unit,
                                        item.quantity,
                                    )}{' '}
                                    / {item.initialQuantity}
                                </span>
                            </div>
                            <QuantityBar item={item} className="mt-4" />
                        </div>

                        <div className="surface flex items-center gap-4 p-5">
                            <FreshnessRing
                                freshness={item.freshness}
                                size={78}
                                stroke={7}
                            >
                                <span className="text-2xl">
                                    {item.freshness.status === 'expired'
                                        ? '⚠️'
                                        : item.freshness.status === 'soon'
                                          ? '⏳'
                                          : '❄️'}
                                </span>
                            </FreshnessRing>
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground">
                                    Fraîcheur
                                </p>
                                <p
                                    className="font-display text-xl font-bold"
                                    style={{
                                        color: freshnessColor(item.freshness),
                                    }}
                                >
                                    {freshnessLabel(item.freshness)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    avant le {formatDate(item.bestBefore)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <PreparationCard item={item} />

                    {/* Details */}
                    <div className="surface p-5">
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
                            <Detail
                                icon={<ChefHat className="size-4" />}
                                label="Préparé le"
                                value={formatDate(item.preparedOn)}
                            />
                            <Detail
                                icon={<Snowflake className="size-4" />}
                                label="Congelé le"
                                value={formatDate(item.frozenOn)}
                            />
                            <Detail
                                icon={<CalendarDays className="size-4" />}
                                label="À manger avant"
                                value={formatDate(item.bestBefore)}
                            />
                            {item.servings && (
                                <Detail
                                    icon={<Users className="size-4" />}
                                    label="Par portion"
                                    value={`${item.servings} pers.`}
                                />
                            )}
                            {item.weightGrams && (
                                <Detail
                                    icon={<Scale className="size-4" />}
                                    label="Poids"
                                    value={`${item.weightGrams.toLocaleString('fr-FR')} g`}
                                />
                            )}
                            {item.createdBy && (
                                <Detail
                                    icon={<UserRound className="size-4" />}
                                    label="Rangé par"
                                    value={item.createdBy.name}
                                />
                            )}
                        </dl>
                        {item.description && (
                            <p className="mt-5 border-t border-[var(--hairline)] pt-4 text-[15px] leading-relaxed whitespace-pre-line">
                                {item.description}
                            </p>
                        )}
                    </div>

                    {/* History */}
                    <div className="surface p-5">
                        <h2 className="mb-4 font-display text-lg font-bold">
                            Historique
                        </h2>
                        <ul className="space-y-4">
                            {movements.map((movement, index) => (
                                <MovementEntry
                                    key={movement.id}
                                    movement={movement}
                                    index={index}
                                    compact
                                />
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Side */}
                <aside className="space-y-5 lg:sticky lg:top-10 lg:self-start">
                    {!finished && (
                        <StockActions
                            className="hidden lg:block"
                            onOpen={setSheet}
                        />
                    )}

                    {finished && (
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => setSheet('restock')}
                        >
                            <PlusCircle className="size-4" /> Remettre des
                            portions en stock
                        </Button>
                    )}

                    {item.location && freezer ? (
                        <div className="surface p-5">
                            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                                <MapPin className="size-4" />
                                {item.locations.length > 1
                                    ? `Réparti dans ${item.locations.length} tiroirs`
                                    : 'Il se trouve ici'}
                            </p>
                            <ul className="-mx-3 space-y-1">
                                {item.locations.map((location) => (
                                    <li key={location.compartmentId}>
                                        <Link
                                            href={freezersRoutes.show(
                                                location.freezerId,
                                                {
                                                    query: {
                                                        compartment:
                                                            location.compartmentId,
                                                        item: item.id,
                                                    },
                                                },
                                            )}
                                            className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 transition hover:bg-accent"
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate font-display font-bold">
                                                    {location.compartmentName}
                                                </span>
                                                <span className="block truncate text-xs text-muted-foreground">
                                                    {location.freezerName}
                                                </span>
                                            </span>
                                            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-bold text-primary tabular-nums">
                                                {formatQuantity(
                                                    catalog,
                                                    item.unit,
                                                    location.quantity,
                                                )}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            {item.unplacedQuantity > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setSheet('move')}
                                    className="mt-2 w-full rounded-2xl bg-muted px-3 py-2 text-left text-sm font-semibold"
                                >
                                    📍{' '}
                                    {formatQuantity(
                                        catalog,
                                        item.unit,
                                        item.unplacedQuantity,
                                    )}{' '}
                                    à ranger
                                </button>
                            )}
                            <Link
                                href={freezersRoutes.show(freezer.id, {
                                    query: {
                                        compartment:
                                            item.location.compartmentId,
                                        item: item.id,
                                    },
                                })}
                                className="group mt-4 block"
                            >
                                <FreezerVisual
                                    type={freezer.type}
                                    color={freezer.color}
                                    name={freezer.name}
                                    compartments={freezer.compartments}
                                    selectedIds={item.locations
                                        .filter(
                                            (location) =>
                                                location.freezerId ===
                                                freezer.id,
                                        )
                                        .map(
                                            (location) =>
                                                location.compartmentId,
                                        )}
                                    size="sm"
                                />
                                <p className="mt-4 text-center text-sm font-semibold text-primary group-hover:underline">
                                    Ouvrir le congélateur →
                                </p>
                            </Link>
                        </div>
                    ) : (
                        !finished && (
                            <button
                                type="button"
                                onClick={() => setSheet('move')}
                                className="surface w-full p-5 text-left"
                            >
                                <p className="font-display font-bold">
                                    📍 À ranger
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Ce batch n’a pas d’emplacement. Choisis un
                                    tiroir.
                                </p>
                            </button>
                        )
                    )}

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setSheet('label')}
                    >
                        <QrCode className="size-4" /> Étiquette à imprimer
                    </Button>
                </aside>
            </div>

            <TakeSheet
                item={item}
                open={sheet === 'take'}
                onOpenChange={close}
            />
            <RestockSheet
                item={item}
                freezers={freezers}
                open={sheet === 'restock'}
                onOpenChange={close}
            />
            <MoveSheet
                item={item}
                freezers={freezers}
                open={sheet === 'move'}
                onOpenChange={close}
            />
            <DiscardSheet
                item={item}
                open={sheet === 'discard'}
                onOpenChange={close}
            />
            <LabelSheet
                item={item}
                open={sheet === 'label'}
                onOpenChange={close}
            />
            <BottomSheet
                open={sheet === 'delete'}
                onOpenChange={close}
                hero={<span className="text-6xl">⚠️</span>}
                title={
                    <span className="block text-center">
                        Supprimer définitivement ?
                    </span>
                }
                description={
                    <span className="block text-center">
                        Le batch et sa photo seront effacés. Pour un plat mangé
                        ou jeté, utilise plutôt « Je prends » ou « Jeter ».
                    </span>
                }
                footer={
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="lg"
                            className="flex-1"
                            onClick={() => setSheet(null)}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            size="lg"
                            className="flex-1"
                            onClick={() =>
                                router.delete(itemsRoutes.destroy.url(item.id))
                            }
                        >
                            Supprimer
                        </Button>
                    </div>
                }
            >
                <div />
            </BottomSheet>
        </>
    );
}

function StockActions({
    className,
    onOpen,
}: {
    className?: string;
    onOpen: (sheet: Sheet) => void;
}) {
    return (
        <div className={cn('surface space-y-2.5 p-4', className)}>
            <Button size="lg" className="w-full" onClick={() => onOpen('take')}>
                <HandPlatter className="size-5" /> Je prends
            </Button>
            <div className="grid grid-cols-2 gap-2.5">
                <Button variant="secondary" onClick={() => onOpen('restock')}>
                    <PlusCircle className="size-4" /> Rajouter
                </Button>
                <Button variant="secondary" onClick={() => onOpen('move')}>
                    <ArrowRightLeft className="size-4" /> Déplacer
                </Button>
            </div>
        </div>
    );
}

function Detail({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div>
            <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                {icon} {label}
            </dt>
            <dd className="mt-0.5 font-semibold">{value}</dd>
        </div>
    );
}
