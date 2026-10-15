import { Link } from '@inertiajs/react';
import {
    ArrowRightLeft,
    HandPlatter,
    PackagePlus,
    Pencil,
    PlusCircle,
    Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { MemberAvatar } from '@/components/member-avatar';
import { timeAgo } from '@/lib/dates';
import { cn } from '@/lib/utils';
import items from '@/routes/items';
import type { Movement, MovementType } from '@/types';

const META: Record<
    MovementType,
    { verb: string; icon: LucideIcon; tint: string }
> = {
    added: { verb: 'a rangé', icon: PackagePlus, tint: 'bg-sky-500' },
    taken: { verb: 'a pris', icon: HandPlatter, tint: 'bg-amber-500' },
    restocked: { verb: 'a rajouté', icon: PlusCircle, tint: 'bg-emerald-500' },
    moved: { verb: 'a déplacé', icon: ArrowRightLeft, tint: 'bg-violet-500' },
    updated: { verb: 'a modifié', icon: Pencil, tint: 'bg-slate-400' },
    discarded: { verb: 'a jeté', icon: Trash2, tint: 'bg-rose-500' },
};

export function MovementEntry({
    movement,
    index = 0,
    compact = false,
}: {
    movement: Movement;
    index?: number;
    compact?: boolean;
}) {
    const meta = META[movement.type];
    const who = movement.user?.name.split(' ')[0] ?? 'Quelqu’un';

    const detail =
        movement.type === 'moved'
            ? movement.to && `vers ${movement.to}`
            : movement.type === 'taken' || movement.type === 'discarded'
              ? movement.from && `de ${movement.from}`
              : movement.to && `dans ${movement.to}`;

    const name = movement.itemId ? (
        <Link
            href={items.show(movement.itemId)}
            className="font-semibold text-foreground hover:underline"
        >
            {movement.itemName}
        </Link>
    ) : (
        <span className="font-semibold text-foreground">
            {movement.itemName}
        </span>
    );

    return (
        <motion.li
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index, 15) * 0.03 }}
            className="relative flex gap-3"
        >
            <div className="relative">
                {movement.user ? (
                    <MemberAvatar
                        name={movement.user.name}
                        id={movement.user.id}
                        className={compact ? 'size-8 text-[11px]' : ''}
                    />
                ) : (
                    <span className="grid size-9 place-items-center rounded-full bg-muted text-sm">
                        ?
                    </span>
                )}
                <span
                    className={cn(
                        'absolute -right-1 -bottom-1 grid size-[18px] place-items-center rounded-full text-white ring-2 ring-card',
                        meta.tint,
                    )}
                >
                    <meta.icon className="size-2.5" strokeWidth={3} />
                </span>
            </div>

            <div className="min-w-0 flex-1 pb-1 text-[13.5px] leading-snug text-muted-foreground">
                <span className="font-semibold text-foreground">{who}</span>{' '}
                {meta.verb}{' '}
                {movement.quantity !== null &&
                    movement.type !== 'moved' &&
                    movement.type !== 'updated' && (
                        <span className="font-semibold text-foreground">
                            {movement.quantity} ×{' '}
                        </span>
                    )}
                {movement.itemEmoji} {name}
                {detail && <span> {detail}</span>}
                {movement.note && (
                    <span className="italic"> — {movement.note}</span>
                )}
                <div className="mt-0.5 text-xs text-muted-foreground/80">
                    {timeAgo(movement.createdAt)}
                </div>
            </div>
        </motion.li>
    );
}
