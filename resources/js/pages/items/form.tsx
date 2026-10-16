import { Head, useForm } from '@inertiajs/react';
import {
    Camera,
    Check,
    ImagePlus,
    RefreshCw,
    Snowflake,
    Sparkles,
    Trash2,
    Wand2,
    X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StepLabel } from '@/components/freezer/freezer-configurator';
import InputError from '@/components/input-error';
import { PlacementEditor } from '@/components/items/placement-editor';
import { PageHeader } from '@/components/page-header';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input, Textarea } from '@/components/ui/input';
import { EmojiGrid } from '@/components/ui/pickers';
import { Spinner } from '@/components/ui/spinner';
import { Stepper } from '@/components/ui/stepper';
import {
    findCategory,
    formatQuantity,
    unitWord,
    useCatalog,
} from '@/lib/catalog';
import { addMonthsIso, durationLabel, formatDate, todayIso } from '@/lib/dates';
import { useIsDesktop } from '@/hooks/use-media-query';
import { compressImage } from '@/lib/image';
import { totalOf, withTotal } from '@/lib/placements';
import type { PlacementDraft } from '@/lib/placements';
import { cn } from '@/lib/utils';
import itemsRoutes from '@/routes/items';
import type { FreezerOption, Item } from '@/types';

type Suggestion = {
    id: number;
    name: string;
    emoji: string;
    category: string;
    unit: string;
    servings: number | null;
};

type Props = {
    item: Item | null;
    source: Item | null;
    defaultCompartmentId: number | null;
    freezers: FreezerOption[];
    suggestions: Suggestion[];
};

type FormData = {
    name: string;
    emoji: string;
    category: string;
    description: string;
    photo: File | null;
    remove_photo: boolean;
    photo_from: number | null;
    quantity: number;
    unit: string;
    servings: number | null;
    weight_grams: string;
    prepared_on: string;
    frozen_on: string;
    best_before: string;
    tags: string[];
    placements: PlacementDraft[];
};

const QUICK_QUANTITIES = [1, 2, 4, 6, 8, 10, 12];

export default function ItemForm({
    item,
    source,
    defaultCompartmentId,
    freezers,
    suggestions,
}: Props) {
    const catalog = useCatalog();
    const isDesktop = useIsDesktop();
    const editing = item !== null;
    const base = item ?? source;
    const today = todayIso();

    const form = useForm<FormData>({
        name: base?.name ?? '',
        emoji: base?.emoji ?? '',
        category: base?.category ?? 'meal',
        description: base?.description ?? '',
        photo: null,
        remove_photo: false,
        photo_from: !editing && source?.photoUrl ? source.id : null,
        quantity: item?.quantity ?? source?.initialQuantity ?? 4,
        unit: base?.unit ?? 'portion',
        servings: base?.servings ?? null,
        weight_grams: base?.weightGrams ? String(base.weightGrams) : '',
        prepared_on: item?.preparedOn ?? today,
        frozen_on: item?.frozenOn ?? today,
        best_before: item?.bestBefore ?? '',
        tags: base?.tags ?? [],
        placements: item
            ? item.locations.map((location, index) => ({
                  compartment_id: location.compartmentId,
                  // Portions left without a drawer join the main one.
                  quantity:
                      location.quantity +
                      (index === 0 ? item.unplacedQuantity : 0),
              }))
            : defaultCompartmentId
              ? [
                    {
                        compartment_id: defaultCompartmentId,
                        quantity: source?.initialQuantity ?? 4,
                    },
                ]
              : [],
    });

    const [autoBestBefore, setAutoBestBefore] = useState(!editing);
    const [preview, setPreview] = useState<string | null>(
        editing ? item.photoUrl : (source?.photoUrl ?? null),
    );
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [compressing, setCompressing] = useState(false);
    const [tagDraft, setTagDraft] = useState('');
    const cameraInput = useRef<HTMLInputElement>(null);
    const galleryInput = useRef<HTMLInputElement>(null);

    const category = findCategory(catalog, form.data.category);
    const computedBestBefore = addMonthsIso(
        form.data.frozen_on || today,
        category?.shelfLifeMonths ?? 3,
    );
    const bestBefore = autoBestBefore
        ? computedBestBefore
        : form.data.best_before;
    const displayEmoji = form.data.emoji || category?.emoji || '🍲';

    useEffect(() => {
        return () => {
            if (preview?.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const matchingSuggestions = useMemo(() => {
        const query = form.data.name.trim().toLowerCase();

        if (editing) {
            return [];
        }

        return suggestions
            .filter((suggestion) =>
                query
                    ? suggestion.name.toLowerCase().includes(query) &&
                      suggestion.name.toLowerCase() !== query
                    : true,
            )
            .slice(0, 8);
    }, [form.data.name, suggestions, editing]);

    const applySuggestion = (suggestion: Suggestion) => {
        form.setData((data) => ({
            ...data,
            name: suggestion.name,
            emoji: suggestion.emoji,
            category: suggestion.category,
            unit: suggestion.unit,
            servings: suggestion.servings,
        }));
    };

    const pickPhoto = async (file: File | undefined) => {
        if (!file) {
            return;
        }

        setCompressing(true);
        const compressed = await compressImage(file);
        setCompressing(false);

        form.setData((data) => ({
            ...data,
            photo: compressed,
            remove_photo: false,
            photo_from: null,
        }));
        setPreview(URL.createObjectURL(compressed));
    };

    const removePhoto = () => {
        form.setData((data) => ({
            ...data,
            photo: null,
            remove_photo: true,
            photo_from: null,
        }));
        setPreview(null);
    };

    const addTag = () => {
        const tag = tagDraft.trim().toLowerCase();

        if (tag && !form.data.tags.includes(tag) && form.data.tags.length < 8) {
            form.setData('tags', [...form.data.tags, tag]);
        }

        setTagDraft('');
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            best_before: bestBefore,
            weight_grams: data.weight_grams || null,
            ...(editing ? { _method: 'put' } : {}),
        }));

        form.post(
            editing ? itemsRoutes.update.url(item.id) : itemsRoutes.store.url(),
            {
                forceFormData: true,
                preserveScroll: true,
                onError: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
            },
        );
    };

    const setTotal = (value: number) =>
        form.setData((data) => ({
            ...data,
            quantity: value,
            placements: withTotal(data.placements, value),
        }));

    const setPlacements = (placements: PlacementDraft[]) =>
        form.setData((data) => ({
            ...data,
            placements,
            quantity:
                placements.length > 0 ? totalOf(placements) : data.quantity,
        }));

    const placementsError =
        form.errors.placements ??
        Object.entries(form.errors).find(([key]) =>
            key.startsWith('placements.'),
        )?.[1];

    const firstCompartment = freezers
        .flatMap((freezer) => freezer.compartments)
        .find(
            (compartment) =>
                compartment.id === form.data.placements[0]?.compartment_id,
        );
    const minimumTotal = Math.max(1, form.data.placements.length);

    return (
        <>
            <Head
                title={editing ? `Modifier ${item.name}` : 'Ranger un batch'}
            />

            <PageHeader
                back={editing ? itemsRoutes.show(item.id) : undefined}
                eyebrow={
                    editing
                        ? 'Modifier'
                        : source
                          ? 'On refait ce batch'
                          : 'Nouveau batch'
                }
                title={editing ? item.name : 'Qu’est-ce qu’on range ?'}
            />

            <form
                onSubmit={submit}
                className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12"
            >
                <div className="space-y-9">
                    {/* Photo + name */}
                    <section className="surface overflow-hidden p-0">
                        <div className="relative">
                            <AnimatePresence mode="wait">
                                {preview ? (
                                    <motion.div
                                        key="photo"
                                        initial={{ opacity: 0, scale: 1.04 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="relative aspect-[16/10] w-full overflow-hidden bg-muted sm:aspect-[16/8]"
                                    >
                                        <img
                                            src={preview}
                                            alt=""
                                            className="size-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent" />
                                        <div className="absolute right-3 bottom-3 flex gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                className="bg-white/90 text-slate-900"
                                                onClick={() =>
                                                    galleryInput.current?.click()
                                                }
                                            >
                                                <RefreshCw className="size-4" />{' '}
                                                Changer
                                            </Button>
                                            <Button
                                                type="button"
                                                size="icon-sm"
                                                variant="secondary"
                                                className="bg-white/90 text-slate-900"
                                                onClick={removePhoto}
                                                aria-label="Retirer la photo"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="relative flex aspect-[16/10] w-full flex-col items-center justify-center gap-4 sm:aspect-[16/7]"
                                        style={{
                                            background: `radial-gradient(circle at 50% 35%, color-mix(in oklab, ${category?.color ?? '#6366f1'} 22%, transparent), transparent 70%)`,
                                        }}
                                    >
                                        <motion.button
                                            type="button"
                                            onClick={() => setEmojiOpen(true)}
                                            whileHover={{
                                                scale: 1.08,
                                                rotate: -6,
                                            }}
                                            whileTap={{ scale: 0.92 }}
                                            className="text-7xl drop-shadow-[0_12px_20px_rgb(0_0_0/0.15)]"
                                            key={displayEmoji}
                                            initial={{
                                                scale: 0.5,
                                                rotate: -20,
                                            }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 14,
                                            }}
                                            aria-label="Choisir un emoji"
                                        >
                                            {displayEmoji}
                                        </motion.button>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    cameraInput.current?.click()
                                                }
                                                disabled={compressing}
                                            >
                                                {compressing ? (
                                                    <Spinner />
                                                ) : (
                                                    <Camera className="size-4" />
                                                )}{' '}
                                                Prendre une photo
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    galleryInput.current?.click()
                                                }
                                                disabled={compressing}
                                            >
                                                <ImagePlus className="size-4" />{' '}
                                                Galerie
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <input
                                ref={cameraInput}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(event) =>
                                    pickPhoto(event.target.files?.[0])
                                }
                            />
                            <input
                                ref={galleryInput}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) =>
                                    pickPhoto(event.target.files?.[0])
                                }
                            />
                        </div>

                        <div className="space-y-3 p-4 sm:p-5">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEmojiOpen(true)}
                                    className="grid size-14 shrink-0 place-items-center rounded-2xl border border-input bg-card text-3xl transition hover:bg-accent"
                                    aria-label="Choisir un emoji"
                                >
                                    {displayEmoji}
                                </button>
                                <Input
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    placeholder="Lasagnes, soupe de potiron…"
                                    className="h-14 text-lg font-bold"
                                    maxLength={120}
                                    aria-invalid={Boolean(form.errors.name)}
                                    autoFocus={!editing && !source}
                                />
                            </div>
                            <InputError message={form.errors.name} />
                            <InputError message={form.errors.photo} />

                            <AnimatePresence>
                                {matchingSuggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                            <Wand2 className="size-3.5" /> Déjà
                                            fait chez vous
                                        </p>
                                        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                                            {matchingSuggestions.map(
                                                (suggestion) => (
                                                    <Chip
                                                        key={suggestion.id}
                                                        icon={suggestion.emoji}
                                                        className="h-9"
                                                        onClick={() =>
                                                            applySuggestion(
                                                                suggestion,
                                                            )
                                                        }
                                                    >
                                                        {suggestion.name}
                                                    </Chip>
                                                ),
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>

                    {/* Category */}
                    <section>
                        <StepLabel step={1} title="Catégorie" />
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                            {catalog.categories.map((option) => {
                                const active =
                                    option.value === form.data.category;

                                return (
                                    <motion.button
                                        key={option.value}
                                        type="button"
                                        whileTap={{ scale: 0.94 }}
                                        onClick={() =>
                                            form.setData(
                                                'category',
                                                option.value,
                                            )
                                        }
                                        className={cn(
                                            'relative flex flex-col items-center gap-1 rounded-2xl border px-1 py-3 text-center transition-colors',
                                            active
                                                ? 'border-transparent text-white'
                                                : 'border-border bg-card/80 hover:bg-accent',
                                        )}
                                        style={
                                            active
                                                ? {
                                                      background: option.color,
                                                      boxShadow: `0 12px 24px -14px ${option.color}`,
                                                  }
                                                : undefined
                                        }
                                    >
                                        <motion.span
                                            className="text-2xl"
                                            animate={
                                                active
                                                    ? {
                                                          scale: [1, 1.3, 1],
                                                          rotate: [0, -10, 0],
                                                      }
                                                    : {}
                                            }
                                        >
                                            {option.emoji}
                                        </motion.span>
                                        <span className="line-clamp-2 text-[11px] leading-tight font-semibold">
                                            {option.label}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Quantity */}
                    <section>
                        <StepLabel step={2} title="Combien ?" />
                        <div className="surface space-y-5 p-5">
                            <Stepper
                                value={form.data.quantity}
                                onChange={setTotal}
                                min={minimumTotal}
                                max={999}
                                size="lg"
                                suffix={unitWord(
                                    catalog,
                                    form.data.unit,
                                    form.data.quantity,
                                )}
                            />
                            <div className="no-scrollbar flex justify-center gap-1.5 overflow-x-auto">
                                {QUICK_QUANTITIES.map((quantity) => (
                                    <button
                                        key={quantity}
                                        type="button"
                                        disabled={quantity < minimumTotal}
                                        onClick={() => setTotal(quantity)}
                                        className={cn(
                                            'size-10 shrink-0 rounded-xl text-sm font-bold transition disabled:opacity-30',
                                            form.data.quantity === quantity
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted hover:bg-accent',
                                        )}
                                    >
                                        {quantity}
                                    </button>
                                ))}
                            </div>
                            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
                                {catalog.units.map((unit) => (
                                    <Chip
                                        key={unit.value}
                                        active={form.data.unit === unit.value}
                                        className="h-9"
                                        onClick={() =>
                                            form.setData('unit', unit.value)
                                        }
                                    >
                                        {form.data.quantity > 1
                                            ? unit.plural
                                            : unit.singular}
                                    </Chip>
                                ))}
                            </div>
                            <InputError message={form.errors.quantity} />

                            <div className="border-t border-[var(--hairline)] pt-4">
                                <p className="mb-2 text-sm font-semibold">
                                    Pour combien de personnes par{' '}
                                    {unitWord(catalog, form.data.unit, 1)} ?
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {[1, 2, 3, 4, 5, 6, 8].map((servings) => (
                                        <button
                                            key={servings}
                                            type="button"
                                            onClick={() =>
                                                form.setData(
                                                    'servings',
                                                    form.data.servings ===
                                                        servings
                                                        ? null
                                                        : servings,
                                                )
                                            }
                                            className={cn(
                                                'h-10 min-w-10 rounded-xl px-3 text-sm font-bold transition',
                                                form.data.servings === servings
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted hover:bg-accent',
                                            )}
                                        >
                                            {servings}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Location (mobile) */}
                    {!isDesktop && (
                        <section>
                            <StepLabel step={3} title="Où le ranger ?" />
                            <div className="surface p-4">
                                <PlacementEditor
                                    freezers={freezers}
                                    placements={form.data.placements}
                                    total={form.data.quantity}
                                    unit={form.data.unit}
                                    onChange={setPlacements}
                                    error={placementsError}
                                />
                            </div>
                        </section>
                    )}

                    {/* Dates */}
                    <section>
                        <StepLabel step={4} title="Les dates" />
                        <div className="surface space-y-4 p-5">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <label className="space-y-1.5">
                                    <span className="text-sm font-semibold">
                                        Préparé le
                                    </span>
                                    <Input
                                        type="date"
                                        max={today}
                                        value={form.data.prepared_on}
                                        onChange={(event) =>
                                            form.setData(
                                                'prepared_on',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={form.errors.prepared_on}
                                    />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-sm font-semibold">
                                        Congelé le
                                    </span>
                                    <Input
                                        type="date"
                                        max={today}
                                        value={form.data.frozen_on}
                                        onChange={(event) =>
                                            form.setData(
                                                'frozen_on',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={form.errors.frozen_on}
                                    />
                                </label>
                            </div>

                            <div className="rounded-2xl bg-muted/70 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold">
                                            À consommer avant
                                        </p>
                                        <p className="font-display text-xl font-extrabold">
                                            {formatDate(bestBefore, {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    {autoBestBefore ? (
                                        <span className="flex items-center gap-1 rounded-full bg-primary/12 px-3 py-1 text-xs font-bold text-primary">
                                            <Sparkles className="size-3.5" />{' '}
                                            Auto ·{' '}
                                            {durationLabel(
                                                (category?.shelfLifeMonths ??
                                                    3) * 30,
                                            )}
                                        </span>
                                    ) : null}
                                </div>
                                {autoBestBefore ? (
                                    <button
                                        type="button"
                                        className="mt-2 text-sm font-semibold text-primary"
                                        onClick={() => {
                                            form.setData(
                                                'best_before',
                                                computedBestBefore,
                                            );
                                            setAutoBestBefore(false);
                                        }}
                                    >
                                        Choisir une autre date
                                    </button>
                                ) : (
                                    <div className="mt-3 flex gap-2">
                                        <Input
                                            type="date"
                                            min={form.data.frozen_on}
                                            value={form.data.best_before}
                                            onChange={(event) =>
                                                form.setData(
                                                    'best_before',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() =>
                                                setAutoBestBefore(true)
                                            }
                                            title="Revenir au calcul automatique"
                                        >
                                            <Sparkles className="size-4" /> Auto
                                        </Button>
                                    </div>
                                )}
                                <InputError
                                    className="mt-2"
                                    message={form.errors.best_before}
                                />
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Conseil pour « {category?.label} » :{' '}
                                    {category?.shelfLifeMonths} mois au
                                    congélateur.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Details */}
                    <section>
                        <StepLabel step={5} title="Détails (facultatif)" />
                        <div className="surface space-y-4 p-5">
                            <Textarea
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                                placeholder="Recette, astuces de réchauffage, allergènes…"
                                rows={3}
                            />
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <label className="space-y-1.5">
                                    <span className="text-sm font-semibold">
                                        Poids total (g)
                                    </span>
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        min={1}
                                        value={form.data.weight_grams}
                                        onChange={(event) =>
                                            form.setData(
                                                'weight_grams',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="ex. 1200"
                                    />
                                    <InputError
                                        message={form.errors.weight_grams}
                                    />
                                </label>
                                <div className="space-y-1.5">
                                    <span className="text-sm font-semibold">
                                        Étiquettes
                                    </span>
                                    <div className="flex gap-2">
                                        <Input
                                            value={tagDraft}
                                            onChange={(event) =>
                                                setTagDraft(event.target.value)
                                            }
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key === 'Enter' ||
                                                    event.key === ','
                                                ) {
                                                    event.preventDefault();
                                                    addTag();
                                                }
                                            }}
                                            placeholder="veggie, sans gluten…"
                                            maxLength={30}
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="icon"
                                            onClick={addTag}
                                            aria-label="Ajouter l’étiquette"
                                        >
                                            <Check className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            {form.data.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    <AnimatePresence>
                                        {form.data.tags.map((tag) => (
                                            <motion.button
                                                key={tag}
                                                type="button"
                                                layout
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                                onClick={() =>
                                                    form.setData(
                                                        'tags',
                                                        form.data.tags.filter(
                                                            (candidate) =>
                                                                candidate !==
                                                                tag,
                                                        ),
                                                    )
                                                }
                                                className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary"
                                            >
                                                #{tag} <X className="size-3" />
                                            </motion.button>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Desktop side: location + summary */}
                <aside className="hidden lg:block">
                    <div className="sticky top-10 space-y-5">
                        <div className="surface p-5">
                            <h2 className="mb-4 font-display text-lg font-bold">
                                Où le ranger ?
                            </h2>
                            {isDesktop && (
                                <PlacementEditor
                                    freezers={freezers}
                                    placements={form.data.placements}
                                    total={form.data.quantity}
                                    unit={form.data.unit}
                                    onChange={setPlacements}
                                    error={placementsError}
                                />
                            )}
                        </div>
                        <Button
                            type="submit"
                            variant="warm"
                            size="lg"
                            className="w-full"
                            disabled={form.processing || compressing}
                        >
                            {form.processing ? (
                                <Spinner />
                            ) : (
                                <Snowflake className="size-5" />
                            )}
                            {editing ? 'Enregistrer' : 'Ranger au congélo'}
                        </Button>
                    </div>
                </aside>

                {/* Mobile sticky bar */}
                <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-[var(--hairline)] bg-background/85 px-4 pt-3 backdrop-blur-2xl lg:hidden">
                    <div className="mx-auto flex max-w-xl items-center gap-3">
                        <div className="min-w-0 flex-1 text-sm">
                            <p className="truncate font-bold">
                                {displayEmoji}{' '}
                                {formatQuantity(
                                    catalog,
                                    form.data.unit,
                                    form.data.quantity,
                                )}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {form.data.placements.length > 1
                                    ? `→ ${form.data.placements.length} tiroirs`
                                    : firstCompartment
                                      ? `→ ${firstCompartment.name}`
                                      : 'Choisis un tiroir'}
                            </p>
                        </div>
                        <Button
                            type="submit"
                            variant="warm"
                            size="lg"
                            disabled={form.processing || compressing}
                        >
                            {form.processing ? (
                                <Spinner />
                            ) : (
                                <Snowflake className="size-5" />
                            )}
                            {editing ? 'Enregistrer' : 'Ranger'}
                        </Button>
                    </div>
                </div>
            </form>

            <BottomSheet
                open={emojiOpen}
                onOpenChange={setEmojiOpen}
                title="Choisis un emoji"
            >
                <EmojiGrid
                    value={form.data.emoji}
                    onChange={(emoji) => {
                        form.setData('emoji', emoji);
                        setEmojiOpen(false);
                    }}
                />
                {form.data.emoji && (
                    <Button
                        variant="ghost"
                        className="mt-3 w-full"
                        onClick={() => {
                            form.setData('emoji', '');
                            setEmojiOpen(false);
                        }}
                    >
                        Utiliser l’emoji de la catégorie
                    </Button>
                )}
            </BottomSheet>
        </>
    );
}
