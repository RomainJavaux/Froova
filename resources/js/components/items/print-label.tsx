import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { findCategory, formatQuantity, useCatalog } from '@/lib/catalog';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import itemsRoutes from '@/routes/items';
import type { Item } from '@/types';

export type LabelFormat = 'detailed' | 'square';

/**
 * Physical label sizes, width × height in millimetres.
 */
export const LABEL_FORMATS: Record<
    LabelFormat,
    { width: number; height: number; name: string }
> = {
    detailed: { width: 90, height: 38, name: 'Détaillée' },
    square: { width: 29, height: 29, name: 'QR code' },
};

const NUMERIC_DATE: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
};

/**
 * Sharp SVG QR code pointing to the batch page.
 */
export function useItemQr(item: Item): string | null {
    const [svg, setSvg] = useState<string | null>(null);

    useEffect(() => {
        const url = `${window.location.origin}${itemsRoutes.show.url(item.id)}`;

        void QRCode.toString(url, {
            type: 'svg',
            margin: 0,
            errorCorrectionLevel: 'M',
            color: { dark: '#000000', light: '#ffffff' },
        }).then(setSvg);
    }, [item.id]);

    return svg;
}

/**
 * Black-on-white label drawn at its real size, made for thermal label printers.
 */
export function ItemLabel({
    item,
    format,
    qr,
    className,
}: {
    item: Item;
    format: LabelFormat;
    qr: string | null;
    className?: string;
}) {
    const catalog = useCatalog();
    const { width, height } = LABEL_FORMATS[format];

    const code = (
        <div
            className="size-full [&_path]:[shape-rendering:crispEdges] [&>svg]:block [&>svg]:size-full"
            dangerouslySetInnerHTML={qr ? { __html: qr } : undefined}
        />
    );

    if (format === 'square') {
        return (
            <div
                className={cn('item-label bg-white', className)}
                style={{
                    width: `${width}mm`,
                    height: `${height}mm`,
                    padding: '2mm',
                }}
            >
                {code}
            </div>
        );
    }

    const category = findCategory(catalog, item.category);
    const details = [
        formatQuantity(catalog, item.unit, item.initialQuantity),
        item.servings ? `${item.servings} pers.` : null,
        item.weightGrams ? `${item.weightGrams} g` : null,
    ].filter(Boolean);

    return (
        <div
            className={cn(
                'item-label flex bg-white font-sans text-black',
                className,
            )}
            style={{
                width: `${width}mm`,
                height: `${height}mm`,
                padding: '2.5mm',
                gap: '3mm',
            }}
        >
            <div className="shrink-0" style={{ width: '33mm', height: '33mm' }}>
                {code}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
                <div
                    className="line-clamp-2 leading-[1.1] font-extrabold"
                    style={{ fontSize: '12.5pt' }}
                >
                    {item.name}
                </div>
                <div
                    className="mt-[0.6mm] truncate font-semibold uppercase"
                    style={{ fontSize: '6.5pt', letterSpacing: '0.04em' }}
                >
                    {category?.label}
                </div>

                <div className="mt-auto border-t-[0.4mm] border-black pt-[1.2mm]">
                    <div
                        className="font-bold uppercase"
                        style={{ fontSize: '6.5pt', letterSpacing: '0.04em' }}
                    >
                        À consommer avant
                    </div>
                    <div
                        className="leading-none font-extrabold tabular-nums"
                        style={{ fontSize: '17pt' }}
                    >
                        {item.bestBefore
                            ? formatDate(item.bestBefore, NUMERIC_DATE)
                            : '—'}
                    </div>
                    <div
                        className="mt-[1.2mm] leading-[1.25] font-semibold tabular-nums"
                        style={{ fontSize: '7.5pt' }}
                    >
                        <div className="truncate">
                            Congelé le {formatDate(item.frozenOn, NUMERIC_DATE)}
                        </div>
                        <div className="truncate">{details.join(' · ')}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
