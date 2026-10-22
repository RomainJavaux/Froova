import QRCode from 'qrcode';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatQuantity, useCatalog } from '@/lib/catalog';
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
                data-format="square"
                className={cn('item-label bg-white', className)}
                style={{
                    width: `${width}mm`,
                    height: `${height}mm`,
                    padding: '4mm',
                }}
            >
                {code}
            </div>
        );
    }

    const details = [
        formatQuantity(catalog, item.unit, item.initialQuantity),
        item.servings ? `${item.servings} pers.` : null,
        item.weightGrams ? `${item.weightGrams} g` : null,
    ].filter(Boolean);

    return (
        <div
            data-format="detailed"
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
                <FittedTitle text={item.name} />

                <div className="mt-[1.2mm] shrink-0 border-t-[0.4mm] border-black pt-[1.2mm]">
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

const TITLE_MIN_PT = 8;
const TITLE_MAX_PT = 34;

/**
 * Dish name set as large as the free space allows: short names get huge,
 * long ones wrap and shrink until they fit, never cutting a word.
 */
function FittedTitle({ text }: { text: string }) {
    const box = useRef<HTMLDivElement>(null);
    const title = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const container = box.current;
        const element = title.current;

        if (!container || !element) {
            return;
        }

        const fit = () => {
            if (container.clientHeight === 0) {
                return;
            }

            const fits = (size: number) => {
                element.style.fontSize = `${size}pt`;

                return (
                    element.scrollHeight <= container.clientHeight &&
                    element.scrollWidth <= container.clientWidth
                );
            };

            let low = TITLE_MIN_PT;
            let high = TITLE_MAX_PT;

            // Half-point precision is plenty on a 300 dpi label.
            while (high - low > 0.5) {
                const middle = (low + high) / 2;

                if (fits(middle)) {
                    low = middle;
                } else {
                    high = middle;
                }
            }

            element.style.fontSize = `${low}pt`;
        };

        fit();
        void document.fonts?.ready.then(fit);

        const observer = new ResizeObserver(fit);
        observer.observe(container);

        return () => observer.disconnect();
    }, [text]);

    return (
        <div
            ref={box}
            className="flex min-h-0 flex-1 items-center overflow-hidden"
        >
            <div
                ref={title}
                className="w-full leading-[1.05] font-extrabold tracking-tight break-normal hyphens-none"
                style={{ fontSize: `${TITLE_MIN_PT}pt` }}
            >
                {text}
            </div>
        </div>
    );
}
