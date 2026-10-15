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

export function RestockSheet({ item, open, onOpenChange }: SheetProps) {
    const catalog = useCatalog();
    const [quantity, setQuantity] = useState(1);
    const [processing, setProcessing] = useState(false);

    const submit = () =>
        router.post(
            itemsRoutes.restock.url(item.id),
            { quantity },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    onOpenChange(false);
                    setQuantity(1);
                },
            },
        );

    return (
        <BottomSheet
            open={open}
            onOpenChange={onOpenChange}
            title="Rajouter au même batch"
            description="Tu as refait la même chose ? Ajoute les portions à ce lot."
            footer={
                <Button
                    size="lg"
                    className="w-full"
                    disabled={processing}
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
        </BottomSheet>
    );
}

export function MoveSheet({
    item,
    open,
    onOpenChange,
    freezers,
}: SheetProps & { freezers: FreezerOption[] }) {
    const catalog = useCatalog();
    const [target, setTarget] = useState<number | null>(item.compartmentId);
    const [processing, setProcessing] = useState(false);

    const submit = () => {
        if (!target) {
            return;
        }

        router.post(
            itemsRoutes.move.url(item.id),
            { compartment_id: target },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => onOpenChange(false),
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
                        processing || !target || target === item.compartmentId
                    }
                    onClick={submit}
                >
                    {processing ? (
                        <Spinner />
                    ) : (
                        <ArrowRightLeft className="size-5" />
                    )}{' '}
                    Déplacer ici
                </Button>
            }
        >
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
                                const active = target === compartment.id;
                                const current =
                                    item.compartmentId === compartment.id;

                                return (
                                    <motion.button
                                        key={compartment.id}
                                        type="button"
                                        whileTap={{ scale: 0.96 }}
                                        onClick={() =>
                                            setTarget(compartment.id)
                                        }
                                        className={cn(
                                            'relative flex items-center gap-2 rounded-2xl border p-3 text-left text-sm font-semibold transition',
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
                                        {current && (
                                            <span className="text-[10px] text-muted-foreground">
                                                actuel
                                            </span>
                                        )}
                                        {active && !current && (
                                            <Check className="size-4" />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                ))}
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
