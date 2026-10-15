import { Head, router, useForm } from '@inertiajs/react';
import { Check, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import {
    FreezerConfigurator,
    defaultCompartmentNames,
    draftKey,
} from '@/components/freezer/freezer-configurator';
import type { FreezerDraft } from '@/components/freezer/freezer-configurator';
import { FreezerVisual } from '@/components/freezer/freezer-visual';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { todayIso } from '@/lib/dates';
import freezers from '@/routes/freezers';
import type { Freezer } from '@/types';

type FormData = FreezerDraft & {
    notes: string;
    last_defrosted_on: string;
};

export default function FreezerForm({ freezer }: { freezer: Freezer | null }) {
    const editing = freezer !== null;
    const [confirmDelete, setConfirmDelete] = useState(false);

    const form = useForm<FormData>({
        name: freezer?.name ?? '',
        type: freezer?.type ?? 'upright',
        color: freezer?.color ?? 'frost',
        location: freezer?.location ?? '',
        notes: freezer?.notes ?? '',
        last_defrosted_on: freezer?.lastDefrostedOn ?? '',
        compartments: freezer
            ? freezer.compartments.map((compartment) => ({
                  key: `c${compartment.id}`,
                  id: compartment.id,
                  name: compartment.name,
                  itemsCount: compartment.itemsCount,
              }))
            : defaultCompartmentNames('Tiroir', 5, 'upright').map((name) => ({
                  key: draftKey(),
                  name,
              })),
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        if (editing) {
            form.put(freezers.update.url(freezer.id), { preserveScroll: true });
        } else {
            form.post(freezers.store.url(), { preserveScroll: true });
        }
    };

    const itemsInside = freezer?.stats.items ?? 0;

    return (
        <>
            <Head
                title={
                    editing ? `Modifier ${freezer.name}` : 'Nouveau congélateur'
                }
            />

            <PageHeader
                back={editing ? freezers.show(freezer.id) : freezers.index()}
                eyebrow={editing ? 'Configuration' : 'Nouveau congélateur'}
                title={editing ? freezer.name : 'Configure ton congélo'}
                description={
                    editing
                        ? 'Renomme, réorganise les tiroirs, change la couleur.'
                        : 'Quelques secondes et tes tiroirs sont prêts à être remplis.'
                }
            />

            <form
                onSubmit={submit}
                className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12"
            >
                <div className="order-2 space-y-9 lg:order-1">
                    <FreezerConfigurator
                        value={form.data}
                        onChange={(value) =>
                            form.setData((data) => ({ ...data, ...value }))
                        }
                        errors={form.errors}
                    />

                    <section className="space-y-3">
                        <h2 className="font-display text-lg font-bold">
                            Infos pratiques
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="space-y-1.5">
                                <span className="text-sm font-semibold">
                                    Dernier dégivrage
                                </span>
                                <Input
                                    type="date"
                                    max={todayIso()}
                                    value={form.data.last_defrosted_on}
                                    onChange={(event) =>
                                        form.setData(
                                            'last_defrosted_on',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={form.errors.last_defrosted_on}
                                />
                            </label>
                        </div>
                        <Textarea
                            value={form.data.notes}
                            onChange={(event) =>
                                form.setData('notes', event.target.value)
                            }
                            placeholder="Notes : modèle, réglage du thermostat, garantie…"
                            rows={3}
                        />
                    </section>

                    {editing && (
                        <section className="rounded-3xl border border-destructive/25 bg-destructive/5 p-5">
                            <h2 className="font-display font-bold text-destructive">
                                Supprimer ce congélateur
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {itemsInside > 0
                                    ? `Les ${itemsInside} aliments qu’il contient resteront dans l’inventaire, marqués « à ranger ».`
                                    : 'Il est vide, rien ne sera perdu.'}
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                className="mt-4 text-destructive"
                                onClick={() => setConfirmDelete(true)}
                            >
                                <Trash2 className="size-4" /> Supprimer
                            </Button>
                        </section>
                    )}
                </div>

                {/* Live preview */}
                <div className="order-1 lg:order-2">
                    <div className="lg:sticky lg:top-10">
                        <motion.div
                            layout
                            className="surface relative overflow-hidden px-6 pt-6 pb-8"
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_60%)]" />
                            <p className="relative mb-5 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                Aperçu en direct
                            </p>
                            <div className="relative">
                                <FreezerVisual
                                    type={form.data.type}
                                    color={form.data.color}
                                    name={form.data.name || 'Mon congélateur'}
                                    compartments={form.data.compartments.map(
                                        (compartment) => ({
                                            id: compartment.key,
                                            name: compartment.name || '…',
                                            itemsCount: compartment.itemsCount,
                                        }),
                                    )}
                                    size="md"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Sticky action bar */}
                <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-[var(--hairline)] bg-background/80 px-4 pt-3 backdrop-blur-2xl lg:static lg:order-3 lg:col-span-2 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
                    <div className="mx-auto flex max-w-6xl gap-3 lg:justify-end">
                        <Button
                            type="button"
                            variant="secondary"
                            size="lg"
                            className="lg:w-auto"
                            onClick={() => window.history.back()}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            size="lg"
                            className="flex-1 lg:w-64 lg:flex-none"
                            disabled={form.processing}
                        >
                            {form.processing ? (
                                <Spinner />
                            ) : (
                                <Check className="size-5" />
                            )}
                            {editing ? 'Enregistrer' : 'Créer le congélateur'}
                        </Button>
                    </div>
                </div>
            </form>

            {editing && (
                <BottomSheet
                    open={confirmDelete}
                    onOpenChange={setConfirmDelete}
                    hero={<span className="text-6xl">🧊</span>}
                    title={
                        <span className="block text-center">
                            Supprimer {freezer.name} ?
                        </span>
                    }
                    description={
                        <span className="block text-center">
                            Cette action est définitive.
                        </span>
                    }
                    footer={
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="lg"
                                className="flex-1"
                                onClick={() => setConfirmDelete(false)}
                            >
                                Garder
                            </Button>
                            <Button
                                variant="destructive"
                                size="lg"
                                className="flex-1"
                                onClick={() =>
                                    router.delete(
                                        freezers.destroy.url(freezer.id),
                                    )
                                }
                            >
                                Supprimer
                            </Button>
                        </div>
                    }
                >
                    <div />
                </BottomSheet>
            )}
        </>
    );
}
