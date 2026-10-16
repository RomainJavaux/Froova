import { router } from '@inertiajs/react';
import {
    ArrowRightLeft,
    Check,
    PlusCircle,
    Printer,
    Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Spinner } from '@/components/ui/spinner';
import { Stepper } from '@/components/ui/stepper';
import {
    findColor,
    formatQuantity,
    gradient,
    unitWord,
    useCatalog,
} from '@/lib/catalog';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import itemsRoutes from '@/routes/items';
import type { FreezerOption, Item } from '@/types';

type SheetProps = {
    item: Item;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

/**
 * Every drawer of the household, grouped by freezer; the drawers holding this batch show its share.
 */
function CompartmentGrid({
    item,
    freezers,
    value,
    onChange,
    disabledId = null,
}: {
    item: Item;
    freezers: FreezerOption[];
    value: number | null;
    onChange: (compartmentId: number) => void;
    disabledId?: number | null;
}) {
    const catalog = useCatalog();

    return (
        <div className="space-y-5">
            {freezers.map((freezer) => (
                <div key={freezer.id}>
                    <p className="mb-2 flex items-center gap-2 text-sm font-bold">
                        <span
                            className="size-3 rounded-full"
                            style={{
                                background: gradient(
                                    findColor(catalog, freezer.color),
                                ),
                            }}
                        />
                        {freezer.name}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {freezer.compartments.map((compartment) => {
                            const active = value === compartment.id;
                            const here = item.locations.find(
                                (location) =>
                                    location.compartmentId === compartment.id,
                            );

                            return (
                                <motion.button
                                    key={compartment.id}
                                    type="button"
                                    whileTap={{ scale: 0.96 }}
                                    disabled={disabledId === compartment.id}
                                    onClick={() => onChange(compartment.id)}
                                    className={cn(
                                        'relative flex items-center gap-2 rounded-2xl border p-3 text-left text-sm font-semibold transition disabled:opacity-40',
                                        active
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border hover:bg-accent',
                                    )}
                                >
                                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-xs">
                                        {compartment.position}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate">
                                        {compartment.name}
                                    </span>
                                    {here && (
                                        <span className="rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground tabular-nums">
                                            ×{here.quantity}
                                        </span>
                                    )}
                                    {active && !here && (
                                        <Check className="size-4" />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

export function RestockSheet({
    item,
    open,
    onOpenChange,
    freezers,
}: SheetProps & { freezers: FreezerOption[] }) {
    const catalog = useCatalog();
    const [quantity, setQuantity] = useState(1);
    const [target, setTarget] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const destination = target ?? item.compartmentId;

    const submit = () =>
        router.post(
            itemsRoutes.restock.url(item.id),
            { quantity, compartment_id: destination },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    onOpenChange(false);
                    setQuantity(1);
                    setTarget(null);
                },
            },
        );

    return (
        <BottomSheet
            open={open}
            onOpenChange={onOpenChange}
            title="Rajouter au même batch"
            description="Tu as refait la même chose ? Ajoute les portions à ce lot, dans le tiroir de ton choix."
            footer={
                <Button
                    size="lg"
                    className="w-full"
                    disabled={processing || destination === null}
                    onClick={submit}
                >
                    {processing ? (
                        <Spinner />
                    ) : (
                        <PlusCircle className="size-5" />
                    )}
                    Ajouter {formatQuantity(catalog, item.unit, quantity)}
                </Button>
            }
        >
            <Stepper
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={999}
                size="lg"
                suffix={unitWord(catalog, item.unit, quantity)}
                className="py-4"
            />
            <p className="mt-2 mb-3 text-sm font-semibold">Où les ranger ?</p>
            <CompartmentGrid
                item={item}
                freezers={freezers}
                value={destination}
                onChange={setTarget}
            />
        </BottomSheet>
    );
}

type MoveSource = number | 'unplaced';

export function MoveSheet({
    item,
    open,
    onOpenChange,
    freezers,
}: SheetProps & { freezers: FreezerOption[] }) {
    const catalog = useCatalog();
    const sources: { key: MoveSource; label: string; quantity: number }[] = [
        ...item.locations.map((location) => ({
            key: location.compartmentId as MoveSource,
            label: location.compartmentName,
            quantity: location.quantity,
        })),
        ...(item.unplacedQuantity > 0
            ? [
                  {
                      key: 'unplaced' as MoveSource,
                      label: 'À ranger',
                      quantity: item.unplacedQuantity,
                  },
              ]
            : []),
    ];
    const [sourceKey, setSourceKey] = useState<MoveSource | null>(null);
    const [quantity, setQuantity] = useState<number | null>(null);
    const [target, setTarget] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const source =
        sources.find((candidate) => candidate.key === sourceKey) ?? sources[0];
    const available = source?.quantity ?? 1;
    const amount = Math.min(quantity ?? available, available);

    const submit = () => {
        if (!target || !source) {
            return;
        }

        router.post(
            itemsRoutes.move.url(item.id),
            {
                compartment_id: target,
                from_compartment_id:
                    source.key === 'unplaced' ? null : source.key,
                from_unplaced: source.key === 'unplaced',
                quantity: amount,
            },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    onOpenChange(false);
                    setTarget(null);
                    setQuantity(null);
                    setSourceKey(null);
                },
            },
        );
    };

    return (
        <BottomSheet
            open={open}
            onOpenChange={onOpenChange}
            title="Déplacer"
            description={`Où se trouve maintenant « ${item.name} » ?`}
            footer={
                <Button
                    size="lg"
                    className="w-full"
                    disabled={
                        processing ||
                        !target ||
                        !source ||
                        target === source.key
                    }
                    onClick={submit}
                >
                    {processing ? (
                        <Spinner />
                    ) : (
                        <ArrowRightLeft className="size-5" />
                    )}{' '}
                    Déplacer {formatQuantity(catalog, item.unit, amount)}
                </Button>
            }
        >
            <div className="space-y-5">
                {sources.length > 1 && (
                    <div>
                        <p className="mb-2 text-sm font-semibold">Depuis</p>
                        <div className="flex flex-wrap gap-2">
                            {sources.map((candidate) => (
                                <Chip
                                    key={candidate.key}
                                    active={candidate.key === source?.key}
                                    className="h-9"
                                    onClick={() => {
                                        setSourceKey(candidate.key);
                                        setQuantity(null);
                                    }}
                                >
                                    {candidate.label}
                                    <span className="rounded-full bg-black/10 px-1.5 text-[11px] tabular-nums dark:bg-white/15">
                                        {candidate.quantity}
                                    </span>
                                </Chip>
                            ))}
                        </div>
                    </div>
                )}

                {available > 1 && (
                    <div>
                        <p className="mb-1 text-sm font-semibold">Combien ?</p>
                        <Stepper
                            value={amount}
                            onChange={setQuantity}
                            min={1}
                            max={available}
                            suffix={unitWord(catalog, item.unit, amount)}
                        />
                    </div>
                )}

                <div>
                    <p className="mb-2 text-sm font-semibold">Vers</p>
                    <CompartmentGrid
                        item={item}
                        freezers={freezers}
                        value={target}
                        onChange={setTarget}
                        disabledId={
                            typeof source?.key === 'number' ? source.key : null
                        }
                    />
                </div>
            </div>
        </BottomSheet>
    );
}

const DISCARD_REASONS = [
    { value: 'expired', label: 'Trop vieux', emoji: '⏰' },
    { value: 'freezer_burn', label: 'Brûlure de congélation', emoji: '🥶' },
    { value: 'other', label: 'Autre', emoji: '🤷' },
];

export function DiscardSheet({ item, open, onOpenChange }: SheetProps) {
    const [reason, setReason] = useState('expired');
    const [processing, setProcessing] = useState(false);

    const submit = () =>
        router.post(
            itemsRoutes.discard.url(item.id),
            {
                reason,
                note: DISCARD_REASONS.find((option) => option.value === reason)
                    ?.label,
            },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => onOpenChange(false),
            },
        );

    return (
        <BottomSheet
            open={open}
            onOpenChange={onOpenChange}
            hero={<span className="text-6xl">🗑️</span>}
            title={
                <span className="block text-center">Jeter {item.name} ?</span>
            }
            description={
                <span className="block text-center">
                    Le batch passera dans « Terminés » et sera compté comme
                    perdu.
                </span>
            }
            footer={
                <Button
                    variant="destructive"
                    size="lg"
                    className="w-full"
                    disabled={processing}
                    onClick={submit}
                >
                    {processing ? <Spinner /> : <Trash2 className="size-5" />}{' '}
                    Jeter
                </Button>
            }
        >
            <div className="flex flex-wrap justify-center gap-2 py-2">
                {DISCARD_REASONS.map((option) => (
                    <Chip
                        key={option.value}
                        icon={option.emoji}
                        active={reason === option.value}
                        onClick={() => setReason(option.value)}
                    >
                        {option.label}
                    </Chip>
                ))}
            </div>
        </BottomSheet>
    );
}

/**
 * Printable label with a QR code that opens the item, to stick on the container.
 */
export function LabelSheet({ item, open, onOpenChange }: SheetProps) {
    const catalog = useCatalog();
    const [qr, setQr] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const url = `${window.location.origin}${itemsRoutes.show.url(item.id)}`;

        void QRCode.toDataURL(url, {
            margin: 0,
            width: 360,
            color: { dark: '#0f172a', light: '#ffffff' },
        }).then(setQr);
    }, [open, item.id]);

    return (
        <BottomSheet
            open={open}
            onOpenChange={onOpenChange}
            title="Étiquette"
            description="Imprime-la ou montre-la : le QR code ouvre directement ce batch."
            footer={
                <Button
                    size="lg"
                    className="w-full"
                    onClick={() => window.print()}
                >
                    <Printer className="size-5" /> Imprimer
                </Button>
            }
        >
            <div className="print-area mx-auto w-full max-w-[340px] rounded-3xl border-2 border-dashed border-slate-300 bg-white p-5 text-slate-900">
                <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="text-4xl">{item.displayEmoji}</div>
                        <div className="mt-1 font-display text-xl leading-tight font-extrabold">
                            {item.name}
                        </div>
                        <div className="mt-2 space-y-0.5 text-[13px]">
                            <div>
                                <span className="text-slate-500">
                                    Congelé :
                                </span>{' '}
                                <strong>{formatDate(item.frozenOn)}</strong>
                            </div>
                            <div>
                                <span className="text-slate-500">
                                    À manger avant :
                                </span>{' '}
                                <strong>{formatDate(item.bestBefore)}</strong>
                            </div>
                            <div>
                                <span className="text-slate-500">Lot :</span>{' '}
                                <strong>
                                    {formatQuantity(
                                        catalog,
                                        item.unit,
                                        item.initialQuantity,
                                    )}
                                </strong>
                                {item.servings
                                    ? ` · ${item.servings} pers.`
                                    : ''}
                            </div>
                        </div>
                    </div>
                    <div className="grid size-28 shrink-0 place-items-center">
                        {qr ? (
                            <img src={qr} alt="QR code" className="size-28" />
                        ) : (
                            <Spinner />
                        )}
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 border-t border-slate-200 pt-2 text-[11px] font-semibold text-slate-500">
                    ❄ froova
                </div>
            </div>
        </BottomSheet>
    );
}
