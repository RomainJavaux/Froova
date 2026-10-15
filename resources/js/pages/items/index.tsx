import { Head, Link } from '@inertiajs/react';
import { Plus, RotateCcw, Search, X } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ItemRow } from '@/components/items/item-row';
import { ItemAvatar } from '@/components/items/item-visuals';
import { TakeSheet } from '@/components/items/take-sheet';
import { EmptyState, PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Segmented } from '@/components/ui/segmented';
import { findCategory, findColor, gradient, useCatalog } from '@/lib/catalog';
import { timeAgo } from '@/lib/dates';
import itemsRoutes from '@/routes/items';
import type { FreezerType, Item } from '@/types';

type Props = {
    items: Item[];
    finished: Item[];
    freezers: { id: number; name: string; color: string; type: FreezerType }[];
};

type Sort = 'expiry' | 'name' | 'recent';

const normalize = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();

export default function ItemsIndex({ items, finished, freezers }: Props) {
    const catalog = useCatalog();
    const searchRef = useRef<HTMLInputElement>(null);
    const [tab, setTab] = useState<'stock' | 'finished'>('stock');
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<string | null>(null);
    const [freezerId, setFreezerId] = useState<number | null>(null);
    const [urgentOnly, setUrgentOnly] = useState(false);
    const [sort, setSort] = useState<Sort>('expiry');
    const [taking, setTaking] = useState<Item | null>(null);
    const deferredQuery = useDeferredValue(query);

    useEffect(() => {
        if (new URLSearchParams(window.location.search).has('focus')) {
            searchRef.current?.focus();
        }
    }, []);

    const presentCategories = useMemo(
        () =>
            catalog.categories.filter((option) =>
                items.some((item) => item.category === option.value),
            ),
        [catalog.categories, items],
    );

    const urgentCount = items.filter(
        (item) =>
            item.freshness.status === 'soon' ||
            item.freshness.status === 'expired',
    ).length;

    const filtered = useMemo(() => {
        const terms = normalize(deferredQuery.trim())
            .split(/\s+/)
            .filter(Boolean);

        const result = items.filter((item) => {
            if (category && item.category !== category) {
                return false;
            }

            if (freezerId && item.location?.freezerId !== freezerId) {
                return false;
            }

            if (
                urgentOnly &&
                item.freshness.status !== 'soon' &&
                item.freshness.status !== 'expired'
            ) {
                return false;
            }

            if (terms.length === 0) {
                return true;
            }

            const haystack = normalize(
                [
                    item.name,
                    item.description ?? '',
                    item.tags.join(' '),
                    findCategory(catalog, item.category)?.label ?? '',
                    item.location?.compartmentName ?? '',
                    item.location?.freezerName ?? '',
                ].join(' '),
            );

            return terms.every((term) => haystack.includes(term));
        });

        return [...result].sort((a, b) => {
            if (sort === 'name') {
                return a.name.localeCompare(b.name, 'fr');
            }

            if (sort === 'recent') {
                return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
            }

            return (a.bestBefore ?? '9999').localeCompare(
                b.bestBefore ?? '9999',
            );
        });
    }, [items, deferredQuery, category, freezerId, urgentOnly, sort, catalog]);

    const totalUnits = filtered.reduce((sum, item) => sum + item.quantity, 0);
    const hasFilters = Boolean(query || category || freezerId || urgentOnly);

    const resetFilters = () => {
        setQuery('');
        setCategory(null);
        setFreezerId(null);
        setUrgentOnly(false);
    };

    return (
        <>
            <Head title="Inventaire" />

            <PageHeader
                eyebrow="Tout ce qui est au frais"
                title="Inventaire"
                actions={
                    <Button
                        asChild
                        variant="warm"
                        className="hidden sm:inline-flex"
                    >
                        <Link href={itemsRoutes.create()}>
                            <Plus className="size-5" /> Ranger un batch
                        </Link>
                    </Button>
                }
            />

            {/* Search */}
            <div className="sticky top-[calc(env(safe-area-inset-top)+4.5rem)] z-20 -mx-4 mb-4 px-4 pb-2 lg:top-4 lg:mx-0 lg:px-0">
                <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-5 z-10 size-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                        ref={searchRef}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Lasagnes, soupe, poulet…"
                        className="glass-strong h-14 w-full rounded-[22px] pr-12 pl-14 text-base font-medium shadow-[var(--shadow-float)] outline-none placeholder:text-muted-foreground/70 focus:ring-4 focus:ring-ring/25"
                        type="text"
                        inputMode="search"
                        enterKeyHint="search"
                    />
                    <AnimatePresence>
                        {query && (
                            <motion.button
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                type="button"
                                onClick={() => setQuery('')}
                                className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                                aria-label="Effacer"
                            >
                                <X className="size-4" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Segmented
                    value={tab}
                    onChange={setTab}
                    options={[
                        {
                            value: 'stock',
                            label: 'En stock',
                            count: items.length,
                        },
                        {
                            value: 'finished',
                            label: 'Terminés',
                            count: finished.length,
                        },
                    ]}
                />
                {tab === 'stock' && (
                    <Segmented
                        size="sm"
                        value={sort}
                        onChange={setSort}
                        options={[
                            { value: 'expiry', label: 'Date limite' },
                            { value: 'name', label: 'A → Z' },
                            { value: 'recent', label: 'Récents' },
                        ]}
                    />
                )}
            </div>

            {tab === 'stock' ? (
                <>
                    {/* Filters */}
                    <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
                        {urgentCount > 0 && (
                            <Chip
                                active={urgentOnly}
                                color="var(--soon)"
                                icon="⏳"
                                onClick={() => setUrgentOnly((value) => !value)}
                            >
                                À finir vite · {urgentCount}
                            </Chip>
                        )}
                        {freezers.length > 1 &&
                            freezers.map((freezer) => (
                                <Chip
                                    key={freezer.id}
                                    active={freezerId === freezer.id}
                                    color={gradient(
                                        findColor(catalog, freezer.color),
                                    )}
                                    icon="❄️"
                                    onClick={() =>
                                        setFreezerId((value) =>
                                            value === freezer.id
                                                ? null
                                                : freezer.id,
                                        )
                                    }
                                >
                                    {freezer.name}
                                </Chip>
                            ))}
                    </div>
                    <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
                        {presentCategories.map((option) => (
                            <Chip
                                key={option.value}
                                active={category === option.value}
                                color={option.color}
                                icon={option.emoji}
                                onClick={() =>
                                    setCategory((value) =>
                                        value === option.value
                                            ? null
                                            : option.value,
                                    )
                                }
                            >
                                {option.label}
                            </Chip>
                        ))}
                    </div>

                    <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            <strong className="text-foreground">
                                {filtered.length}
                            </strong>{' '}
                            batch{filtered.length > 1 ? 's' : ''} ·{' '}
                            <strong className="text-foreground">
                                {totalUnits}
                            </strong>{' '}
                            portion{totalUnits > 1 ? 's' : ''}
                        </span>
                        {hasFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="flex items-center gap-1 font-semibold text-primary"
                            >
                                <RotateCcw className="size-3.5" /> Réinitialiser
                            </button>
                        )}
                    </div>

                    {items.length === 0 ? (
                        <EmptyState
                            emoji="🥶"
                            title="Ton inventaire est vide"
                            description="Range ton premier batch et retrouve-le ici en un clin d’œil."
                            action={
                                <Button asChild variant="warm">
                                    <Link href={itemsRoutes.create()}>
                                        <Plus className="size-5" /> Ranger un
                                        batch
                                    </Link>
                                </Button>
                            }
                        />
                    ) : filtered.length === 0 ? (
                        <EmptyState
                            emoji="🔍"
                            title="Introuvable…"
                            description={
                                query
                                    ? `Aucun résultat pour « ${query} ». Peut-être déjà mangé ?`
                                    : 'Aucun batch ne correspond à ces filtres.'
                            }
                            action={
                                <Button
                                    variant="secondary"
                                    onClick={resetFilters}
                                >
                                    Effacer les filtres
                                </Button>
                            }
                        />
                    ) : (
                        <LayoutGroup>
                            <motion.div
                                layout
                                className="grid grid-cols-1 gap-3 md:grid-cols-2"
                            >
                                <AnimatePresence mode="popLayout">
                                    {filtered.map((item, index) => (
                                        <ItemRow
                                            key={item.id}
                                            item={item}
                                            index={index}
                                            onTake={setTaking}
                                        />
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        </LayoutGroup>
                    )}
                </>
            ) : finished.length === 0 ? (
                <EmptyState
                    emoji="🍽️"
                    title="Rien de terminé pour l’instant"
                    description="Les batchs entièrement mangés apparaîtront ici, prêts à être refaits."
                />
            ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {finished.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="surface flex items-center gap-3.5 rounded-[22px] p-3"
                        >
                            <Link
                                href={itemsRoutes.show(item.id)}
                                className="flex min-w-0 flex-1 items-center gap-3.5"
                            >
                                <ItemAvatar
                                    item={item}
                                    className="opacity-80 grayscale-[35%]"
                                />
                                <div className="min-w-0">
                                    <h3 className="truncate font-bold">
                                        {item.name}
                                    </h3>
                                    <p className="text-[13px] text-muted-foreground">
                                        Terminé{' '}
                                        {item.finishedAt
                                            ? timeAgo(item.finishedAt)
                                            : ''}
                                    </p>
                                </div>
                            </Link>
                            <Button asChild size="sm" variant="secondary">
                                <Link
                                    href={itemsRoutes.create({
                                        query: { from: item.id },
                                    })}
                                >
                                    <RotateCcw className="size-4" /> Refaire
                                </Link>
                            </Button>
                        </motion.div>
                    ))}
                </div>
            )}

            <TakeSheet
                item={taking}
                open={taking !== null}
                onOpenChange={(open) => !open && setTaking(null)}
            />
        </>
    );
}
