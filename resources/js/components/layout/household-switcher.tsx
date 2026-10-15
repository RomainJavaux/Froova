import { Link, router, usePage } from '@inertiajs/react';
import { Check, ChevronsUpDown, Plus, Settings2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { findColor, gradient, useCatalog } from '@/lib/catalog';
import { cn } from '@/lib/utils';
import { onboarding } from '@/routes';
import household from '@/routes/household';
import { switchMethod } from '@/routes/households';

export function HouseholdBadge({
    emoji,
    color,
    className,
}: {
    emoji: string;
    color: string;
    className?: string;
}) {
    const catalog = useCatalog();

    return (
        <span
            className={cn(
                'grid size-10 shrink-0 place-items-center rounded-2xl text-xl shadow-[var(--shadow-soft)]',
                className,
            )}
            style={{ background: gradient(findColor(catalog, color)) }}
        >
            <span className="drop-shadow-sm">{emoji}</span>
        </span>
    );
}

export function HouseholdSwitcher({
    variant = 'sidebar',
}: {
    variant?: 'sidebar' | 'compact';
}) {
    const { household: current, households } = usePage().props;

    if (!current) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'group flex items-center gap-3 rounded-2xl text-left transition outline-none focus-visible:ring-4 focus-visible:ring-ring/30',
                        variant === 'sidebar'
                            ? 'w-full p-2 hover:bg-accent/70'
                            : 'min-w-0 py-1 pr-2',
                    )}
                >
                    <HouseholdBadge
                        emoji={current.emoji}
                        color={current.color}
                        className={
                            variant === 'compact'
                                ? 'size-9 rounded-xl text-lg'
                                : ''
                        }
                    />
                    <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-medium text-muted-foreground">
                            Lieu
                        </span>
                        <span className="block truncate font-display text-[15px] leading-tight font-bold">
                            {current.name}
                        </span>
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-72" sideOffset={8}>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Mes lieux
                </DropdownMenuLabel>
                {households.map((item) => (
                    <DropdownMenuItem
                        key={item.id}
                        className="gap-3"
                        onSelect={() =>
                            item.id !== current.id &&
                            router.put(switchMethod.url(item.id))
                        }
                    >
                        <HouseholdBadge
                            emoji={item.emoji}
                            color={item.color}
                            className="size-8 rounded-xl text-base"
                        />
                        <span className="flex-1 truncate font-semibold">
                            {item.name}
                        </span>
                        {item.id === current.id && (
                            <Check className="size-4 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="gap-3">
                    <Link href={household.show()}>
                        <Settings2 className="size-4" /> Gérer « {current.name}{' '}
                        »
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="gap-3">
                    <Link href={onboarding({ query: { new: 1 } })}>
                        <Plus className="size-4" /> Créer un autre lieu
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
