import { Head } from '@inertiajs/react';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import { MovementEntry } from '@/components/activity/movement-entry';
import { EmptyState, PageHeader } from '@/components/page-header';
import { formatDay } from '@/lib/dates';
import type { Movement } from '@/types';

export default function Activity({ movements }: { movements: Movement[] }) {
    const groups = useMemo(() => {
        const map = new Map<string, Movement[]>();

        movements.forEach((movement) => {
            const day = movement.createdAt.slice(0, 10);
            map.set(day, [...(map.get(day) ?? []), movement]);
        });

        return [...map.entries()];
    }, [movements]);

    const taken = movements
        .filter((movement) => movement.type === 'taken')
        .reduce((sum, movement) => sum + (movement.quantity ?? 0), 0);
    const added = movements
        .filter(
            (movement) =>
                movement.type === 'added' || movement.type === 'restocked',
        )
        .reduce((sum, movement) => sum + (movement.quantity ?? 0), 0);
    const discarded = movements
        .filter((movement) => movement.type === 'discarded')
        .reduce((sum, movement) => sum + (movement.quantity ?? 0), 0);

    return (
        <>
            <Head title="Activité" />

            <PageHeader
                eyebrow="Qui a fait quoi"
                title="Activité"
                description="Tout ce qui entre et sort des congélateurs du foyer."
            />

            {movements.length === 0 ? (
                <EmptyState
                    emoji="📭"
                    title="Aucune activité"
                    description="Dès que quelqu’un range ou prend un batch, ça s’affiche ici."
                />
            ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="space-y-6">
                        {groups.map(([day, entries], groupIndex) => (
                            <motion.section
                                key={day}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: Math.min(groupIndex, 6) * 0.05,
                                }}
                                className="surface p-5"
                            >
                                <h2 className="mb-4 font-display text-base font-bold">
                                    {formatDay(entries[0].createdAt)}
                                </h2>
                                <ul className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-px before:bg-border">
                                    {entries.map((movement, index) => (
                                        <MovementEntry
                                            key={movement.id}
                                            movement={movement}
                                            index={index}
                                        />
                                    ))}
                                </ul>
                            </motion.section>
                        ))}
                    </div>

                    <aside className="space-y-3 lg:sticky lg:top-10 lg:self-start">
                        <Stat
                            emoji="📦"
                            value={added}
                            label="portions rangées"
                        />
                        <Stat
                            emoji="🍽️"
                            value={taken}
                            label="portions mangées"
                        />
                        <Stat
                            emoji="🗑️"
                            value={discarded}
                            label="portions jetées"
                            muted
                        />
                        <p className="px-1 text-xs text-muted-foreground">
                            Sur les {movements.length} derniers mouvements.
                        </p>
                    </aside>
                </div>
            )}
        </>
    );
}

function Stat({
    emoji,
    value,
    label,
    muted = false,
}: {
    emoji: string;
    value: number;
    label: string;
    muted?: boolean;
}) {
    return (
        <div className="surface flex items-center gap-4 p-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-muted text-2xl">
                {emoji}
            </span>
            <div>
                <div
                    className={`font-display text-2xl font-extrabold tabular-nums ${muted ? 'text-muted-foreground' : ''}`}
                >
                    {value}
                </div>
                <div className="text-sm text-muted-foreground">{label}</div>
            </div>
        </div>
    );
}
