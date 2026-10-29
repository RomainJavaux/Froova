import { Check, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input, Textarea } from '@/components/ui/input';
import { useCatalog } from '@/lib/catalog';
import { REHEAT_ICONS, THAW_ICONS, usesTemperature } from '@/lib/preparation';
import type { PreparationDraft } from '@/lib/preparation';

const QUICK_MINUTES = [3, 5, 10, 15, 20, 30, 45];
const QUICK_TEMPERATURES = [160, 180, 200, 220];

/**
 * "How to eat it": thawing, reheating method, time, temperature,
 * what to add when serving and free instructions.
 */
export function PreparationFields({
    value,
    onChange,
    errors,
}: {
    value: PreparationDraft;
    onChange: (patch: Partial<PreparationDraft>) => void;
    errors: Partial<Record<string, string>>;
}) {
    const catalog = useCatalog();
    const [extraDraft, setExtraDraft] = useState('');
    const withTemperature = usesTemperature(catalog, value.reheat_method);
    const cold = value.reheat_method === 'cold';

    const addExtra = () => {
        const extra = extraDraft.trim();
        const known = value.extras.some(
            (candidate) => candidate.toLowerCase() === extra.toLowerCase(),
        );

        if (extra && !known && value.extras.length < 12) {
            onChange({ extras: [...value.extras, extra] });
        }

        setExtraDraft('');
    };

    const extrasError = Object.entries(errors).find(([key]) =>
        key.startsWith('extras'),
    )?.[1];

    return (
        <div className="surface space-y-5 p-5">
            <Field label="Décongélation">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    {catalog.thawMethods.map((method) => {
                        const Icon = THAW_ICONS[method.value];

                        return (
                            <Chip
                                key={method.value}
                                active={value.thaw === method.value}
                                className="h-9 justify-center px-2.5 text-[13px] sm:justify-start sm:px-3.5 sm:text-sm"
                                onClick={() =>
                                    onChange({
                                        thaw:
                                            value.thaw === method.value
                                                ? ''
                                                : method.value,
                                    })
                                }
                            >
                                {Icon && <Icon className="size-4" />}
                                {method.label}
                            </Chip>
                        );
                    })}
                </div>
            </Field>

            <Field label="Réchauffage">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    {catalog.reheatMethods.map((method) => {
                        const Icon = REHEAT_ICONS[method.value];

                        return (
                            <Chip
                                key={method.value}
                                active={value.reheat_method === method.value}
                                className="h-9 justify-center px-2.5 text-[13px] sm:justify-start sm:px-3.5 sm:text-sm"
                                onClick={() =>
                                    onChange({
                                        reheat_method:
                                            value.reheat_method === method.value
                                                ? ''
                                                : method.value,
                                    })
                                }
                            >
                                {Icon && <Icon className="size-4" />}
                                {method.label}
                            </Chip>
                        );
                    })}
                </div>
            </Field>

            <AnimatePresence initial={false}>
                {!cold && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field label="Temps">
                                <NumberWithUnit
                                    value={value.reheat_minutes}
                                    onChange={(reheat_minutes) =>
                                        onChange({ reheat_minutes })
                                    }
                                    unit="min"
                                    placeholder="20"
                                    max={600}
                                />
                                <QuickValues
                                    values={QUICK_MINUTES}
                                    current={value.reheat_minutes}
                                    onPick={(minutes) =>
                                        onChange({
                                            reheat_minutes: String(minutes),
                                        })
                                    }
                                />
                                <InputError message={errors.reheat_minutes} />
                            </Field>

                            {withTemperature && (
                                <Field label="Température">
                                    <NumberWithUnit
                                        value={value.reheat_temperature}
                                        onChange={(reheat_temperature) =>
                                            onChange({ reheat_temperature })
                                        }
                                        unit="°C"
                                        placeholder="180"
                                        max={300}
                                    />
                                    <QuickValues
                                        values={QUICK_TEMPERATURES}
                                        current={value.reheat_temperature}
                                        onPick={(temperature) =>
                                            onChange({
                                                reheat_temperature:
                                                    String(temperature),
                                            })
                                        }
                                    />
                                    <InputError
                                        message={errors.reheat_temperature}
                                    />
                                </Field>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Field label="À ajouter en servant">
                <div className="flex gap-2">
                    <Input
                        value={extraDraft}
                        onChange={(event) => setExtraDraft(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ',') {
                                event.preventDefault();
                                addExtra();
                            }
                        }}
                        placeholder="Parmesan, crème fraîche, riz…"
                        maxLength={60}
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={addExtra}
                        aria-label="Ajouter l’ingrédient"
                    >
                        <Check className="size-4" />
                    </Button>
                </div>
                {value.extras.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        <AnimatePresence>
                            {value.extras.map((extra) => (
                                <motion.button
                                    key={extra}
                                    type="button"
                                    layout
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    onClick={() =>
                                        onChange({
                                            extras: value.extras.filter(
                                                (candidate) =>
                                                    candidate !== extra,
                                            ),
                                        })
                                    }
                                    className="flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--warm)_16%,transparent)] px-3 py-1 text-sm font-semibold text-[color:color-mix(in_oklab,var(--warm)_75%,var(--foreground))]"
                                >
                                    {extra} <X className="size-3" />
                                </motion.button>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
                <InputError message={extrasError} />
            </Field>

            <Field label="Instructions">
                <Textarea
                    value={value.reheat_notes}
                    onChange={(event) =>
                        onChange({ reheat_notes: event.target.value })
                    }
                    placeholder="Couvrir de papier alu, remuer à mi-cuisson, ajouter un filet d’eau…"
                    rows={2}
                    maxLength={1000}
                />
                <InputError message={errors.reheat_notes} />
            </Field>
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <p className="mb-2 text-sm font-semibold">{label}</p>
            {children}
        </div>
    );
}

function NumberWithUnit({
    value,
    onChange,
    unit,
    placeholder,
    max,
}: {
    value: string;
    onChange: (value: string) => void;
    unit: string;
    placeholder: string;
    max: number;
}) {
    return (
        <div className="relative">
            <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={max}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="pr-12"
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-muted-foreground">
                {unit}
            </span>
        </div>
    );
}

function QuickValues({
    values,
    current,
    onPick,
}: {
    values: number[];
    current: string;
    onPick: (value: number) => void;
}) {
    return (
        <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
            {values.map((candidate) => (
                <button
                    key={candidate}
                    type="button"
                    onClick={() => onPick(candidate)}
                    className={
                        current === String(candidate)
                            ? 'h-8 shrink-0 rounded-lg bg-primary px-2.5 text-xs font-bold text-primary-foreground'
                            : 'h-8 shrink-0 rounded-lg bg-muted px-2.5 text-xs font-bold transition hover:bg-accent'
                    }
                >
                    {candidate}
                </button>
            ))}
        </div>
    );
}
