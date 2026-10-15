import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, MapPin, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { FreezerVisual } from '@/components/freezer/freezer-visual';
import { EmptyState, PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
    findColor,
    findFreezerType,
    gradient,
    useCatalog,
} from '@/lib/catalog';
import freezers from '@/routes/freezers';
import type { Freezer } from '@/types';

export default function FreezersIndex({
    freezers: list,
}: {
    freezers: Freezer[];
}) {
    const catalog = useCatalog();

    return (
        <>
            <Head title="Congélateurs" />

            <PageHeader
                eyebrow="Mes appareils"
                title="Congélateurs"
                description="Touche un tiroir pour l’ouvrir et voir ce qu’il contient."
                actions={
                    <Button asChild>
                        <Link href={freezers.create()}>
                            <Plus className="size-5" /> Nouveau
                        </Link>
                    </Button>
                }
            />

            {list.length === 0 ? (
                <EmptyState
                    emoji="🧊"
                    title="Aucun congélateur"
                    description="Ajoute ton congélateur (armoire, coffre, combiné…) et configure ses tiroirs en quelques secondes."
                    action={
                        <Button asChild variant="warm" size="lg">
                            <Link href={freezers.create()}>
                                <Plus className="size-5" /> Configurer mon
                                congélateur
                            </Link>
                        </Button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {list.map((freezer, index) => {
                        const palette = findColor(catalog, freezer.color);
                        const type = findFreezerType(catalog, freezer.type);

                        return (
                            <motion.article
                                key={freezer.id}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: index * 0.07,
                                    type: 'spring',
                                    stiffness: 240,
                                    damping: 26,
                                }}
                                className="surface group relative flex flex-col overflow-hidden p-0"
                            >
                                <div
                                    className="relative flex min-h-80 items-center justify-center px-6 pt-8 pb-6"
                                    style={{
                                        background: `radial-gradient(circle at 50% 20%, color-mix(in oklab, ${palette.from} 30%, transparent), transparent 70%)`,
                                    }}
                                >
                                    <FreezerVisual
                                        type={freezer.type}
                                        color={freezer.color}
                                        name={freezer.name}
                                        compartments={freezer.compartments}
                                        size="md"
                                        onSelect={(id) =>
                                            router.visit(
                                                freezers.show(freezer.id, {
                                                    query: { compartment: id },
                                                }),
                                            )
                                        }
                                    />
                                </div>

                                <Link
                                    href={freezers.show(freezer.id)}
                                    className="flex items-center gap-3 border-t border-[var(--hairline)] p-5"
                                >
                                    <span
                                        className="size-10 shrink-0 rounded-2xl"
                                        style={{
                                            background: gradient(palette),
                                        }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <h2 className="truncate font-display text-lg font-bold">
                                            {freezer.name}
                                        </h2>
                                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                                            {type.label}
                                            {freezer.location && (
                                                <>
                                                    {' · '}
                                                    <MapPin className="size-3.5" />{' '}
                                                    {freezer.location}
                                                </>
                                            )}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-display text-xl font-extrabold tabular-nums">
                                            {freezer.stats.units}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground">
                                            portions
                                        </div>
                                    </div>
                                    <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
                                </Link>
                            </motion.article>
                        );
                    })}
                </div>
            )}
        </>
    );
}
