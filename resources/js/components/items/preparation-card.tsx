import { Link } from '@inertiajs/react';
import {
    Plus,
    ShoppingBasket,
    Thermometer,
    Timer,
    UtensilsCrossed,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useCatalog } from '@/lib/catalog';
import {
    REHEAT_ICONS,
    THAW_ICONS,
    formatMinutes,
    hasPreparation,
    reheatSummary,
    usesTemperature,
} from '@/lib/preparation';
import { cn } from '@/lib/utils';
import itemsRoutes from '@/routes/items';
import type { Item } from '@/types';

/**
 * "Pour le manger": the steps from the freezer to the plate.
 */
export function PreparationCard({ item }: { item: Item }) {
    const catalog = useCatalog();

    if (!hasPreparation(item)) {
        return (
            <Link
                href={itemsRoutes.edit.url(item.id)}
                className="flex items-center gap-4 rounded-3xl border-2 border-dashed border-border p-5 text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-muted">
                    <UtensilsCrossed className="size-5" />
                </span>
                <span className="min-w-0 flex-1 text-sm">
                    <strong className="block text-foreground">
                        Comment le manger ?
                    </strong>
                    Ajoute la décongélation, le temps de réchauffage et ce qu’il
                    faut en plus.
                </span>
                <Plus className="size-5 shrink-0" />
            </Link>
        );
    }

    const thaw = catalog.thawMethods.find(
        (method) => method.value === item.thaw,
    );
    const reheat = catalog.reheatMethods.find(
        (method) => method.value === item.reheatMethod,
    );
    const ThawIcon = thaw ? THAW_ICONS[thaw.value] : null;
    const ReheatIcon = reheat ? REHEAT_ICONS[reheat.value] : Timer;
    const temperature =
        usesTemperature(catalog, item.reheatMethod) && item.reheatTemperature;

    const steps: { key: string; icon: ReactNode; content: ReactNode }[] = [];

    if (thaw && ThawIcon) {
        steps.push({
            key: 'thaw',
            icon: <ThawIcon className="size-5" />,
            content: (
                <>
                    <StepTitle>Décongélation</StepTitle>
                    <p className="font-semibold">{thaw.label}</p>
                </>
            ),
        });
    }

    if (reheat || item.reheatMinutes) {
        steps.push({
            key: 'reheat',
            icon: <ReheatIcon className="size-5" />,
            content: (
                <>
                    <StepTitle>
                        {item.reheatMethod === 'cold'
                            ? 'Service'
                            : 'Réchauffage'}
                    </StepTitle>
                    <div className="flex flex-wrap items-center gap-2">
                        {reheat && (
                            <span className="font-semibold">
                                {reheat.label}
                            </span>
                        )}
                        {temperature && (
                            <Pill icon={<Thermometer className="size-3.5" />}>
                                {item.reheatTemperature} °C
                            </Pill>
                        )}
                        {item.reheatMinutes && item.reheatMethod !== 'cold' && (
                            <Pill icon={<Timer className="size-3.5" />}>
                                {formatMinutes(item.reheatMinutes)}
                            </Pill>
                        )}
                    </div>
                </>
            ),
        });
    }

    if (item.extras.length > 0) {
        steps.push({
            key: 'extras',
            icon: <ShoppingBasket className="size-5" />,
            content: (
                <>
                    <StepTitle>À ajouter en servant</StepTitle>
                    <div className="flex flex-wrap gap-1.5">
                        {item.extras.map((extra) => (
                            <span
                                key={extra}
                                className="rounded-full bg-[color-mix(in_oklab,var(--warm)_16%,transparent)] px-3 py-1 text-sm font-semibold text-[color:color-mix(in_oklab,var(--warm)_75%,var(--foreground))]"
                            >
                                {extra}
                            </span>
                        ))}
                    </div>
                </>
            ),
        });
    }

    return (
        <div className="surface p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
                <UtensilsCrossed className="size-5 text-primary" /> Pour le
                manger
            </h2>

            {steps.length > 0 && (
                <ol className="relative space-y-4">
                    {steps.map((step, index) => (
                        <motion.li
                            key={step.key}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * index }}
                            className="relative flex gap-3.5"
                        >
                            {index < steps.length - 1 && (
                                <span className="absolute top-11 bottom-[-1rem] left-[21px] w-0.5 rounded-full bg-[var(--hairline)]" />
                            )}
                            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                                {step.icon}
                            </span>
                            <div className="min-w-0 flex-1 pt-0.5">
                                {step.content}
                            </div>
                        </motion.li>
                    ))}
                </ol>
            )}

            {item.reheatNotes && (
                <p
                    className={cn(
                        'text-[15px] leading-relaxed whitespace-pre-line',
                        steps.length > 0 &&
                            'mt-5 border-t border-[var(--hairline)] pt-4',
                    )}
                >
                    {item.reheatNotes}
                </p>
            )}
        </div>
    );
}

/**
 * Compact reminder for the "Je prends" sheet.
 */
export function PreparationReminder({ item }: { item: Item }) {
    const catalog = useCatalog();

    if (!hasPreparation(item)) {
        return null;
    }

    const thaw = catalog.thawMethods.find(
        (method) => method.value === item.thaw,
    );
    const summary = reheatSummary(catalog, item);
    const lines = [
        thaw && item.thaw !== 'frozen'
            ? `Décongeler : ${thaw.label.toLowerCase()}`
            : null,
        summary,
        item.extras.length > 0 ? `+ ${item.extras.join(', ')}` : null,
    ].filter(Boolean);

    if (lines.length === 0) {
        return null;
    }

    return (
        <div className="flex w-full max-w-xs gap-3 rounded-2xl bg-muted/70 p-3 text-sm">
            <UtensilsCrossed className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0 space-y-0.5">
                {lines.map((line) => (
                    <p key={line} className="font-semibold">
                        {line}
                    </p>
                ))}
            </div>
        </div>
    );
}

function StepTitle({ children }: { children: ReactNode }) {
    return (
        <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {children}
        </p>
    );
}

function Pill({ icon, children }: { icon: ReactNode; children: ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-sm font-bold tabular-nums">
            {icon}
            {children}
        </span>
    );
}
