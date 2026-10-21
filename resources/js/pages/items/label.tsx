import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { useEffect, useRef } from 'react';
import {
    ItemLabel,
    LABEL_FORMATS,
    useItemQr,
} from '@/components/items/print-label';
import type { LabelFormat } from '@/components/items/print-label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import itemsRoutes from '@/routes/items';
import type { Item } from '@/types';

/**
 * Print-only page: the page itself is sized to the label so the printer
 * gets exactly one label, without margins nor blank pages.
 */
export default function ItemLabelPage({
    item,
    format,
}: {
    item: Item;
    format: LabelFormat;
}) {
    const qr = useItemQr(item);
    const printed = useRef(false);
    const { width, height } = LABEL_FORMATS[format];

    useEffect(() => {
        if (qr && !printed.current) {
            printed.current = true;
            // Fonts must be in to size the title; then let the browser paint.
            void document.fonts.ready.then(() =>
                window.setTimeout(() => window.print(), 150),
            );
        }
    }, [qr]);

    return (
        <>
            <Head title={`Étiquette ${item.name}`} />
            <style>{`
                @page { size: ${width}mm ${height}mm; margin: 0; }
                @media print {
                    html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
                    .label-page { display: block !important; min-height: 0 !important; padding: 0 !important; background: #fff !important; }
                    .item-label { break-inside: avoid; }
                }
            `}</style>

            <div className="label-page flex min-h-svh flex-col items-center justify-center gap-6 bg-slate-200 p-6">
                <div className="no-print flex w-full max-w-md flex-wrap items-center justify-between gap-3">
                    <Link
                        href={itemsRoutes.show.url(item.id)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-slate-700"
                    >
                        <ArrowLeft className="size-4" /> Retour
                    </Link>
                    <div className="flex rounded-xl bg-white p-1 text-sm font-semibold text-slate-600 shadow-sm">
                        {(Object.keys(LABEL_FORMATS) as LabelFormat[]).map(
                            (key) => (
                                <Link
                                    key={key}
                                    href={itemsRoutes.label.url(item.id, {
                                        query: { format: key },
                                    })}
                                    replace
                                    className={cn(
                                        'rounded-lg px-3 py-1.5',
                                        key === format &&
                                            'bg-slate-900 text-white',
                                    )}
                                >
                                    {LABEL_FORMATS[key].width} ×{' '}
                                    {LABEL_FORMATS[key].height}
                                </Link>
                            ),
                        )}
                    </div>
                </div>

                <ItemLabel
                    item={item}
                    format={format}
                    qr={qr}
                    className="shadow-lg print:shadow-none"
                />

                <div className="no-print flex flex-col items-center gap-2">
                    <Button size="lg" onClick={() => window.print()}>
                        <Printer className="size-5" /> Imprimer
                    </Button>
                    <p className="max-w-xs text-center text-xs text-slate-600">
                        Choisis le format {width} × {height} mm dans les
                        réglages de ton imprimante, marges à zéro.
                    </p>
                </div>
            </div>
        </>
    );
}
