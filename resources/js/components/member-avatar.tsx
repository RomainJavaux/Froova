import { cn } from '@/lib/utils';

const GRADIENTS = [
    ['#7dd3fc', '#6366f1'],
    ['#6ee7b7', '#0d9488'],
    ['#fdba74', '#f43f5e'],
    ['#d8b4fe', '#7c3aed'],
    ['#fde047', '#ea580c'],
    ['#f9a8d4', '#db2777'],
    ['#67e8f9', '#2563eb'],
];

export function initials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

/**
 * Colored initials bubble; the color is stable for a given person.
 */
export function MemberAvatar({
    name,
    id,
    className,
}: {
    name: string;
    id: number;
    className?: string;
}) {
    const [from, to] = GRADIENTS[Math.abs(id) % GRADIENTS.length];

    return (
        <span
            className={cn(
                'inline-grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white ring-2 ring-background',
                className,
            )}
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
            title={name}
        >
            {initials(name)}
        </span>
    );
}
