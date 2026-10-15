import { Link, router, usePage } from '@inertiajs/react';
import {
    LogOut,
    Moon,
    Palette,
    ShieldCheck,
    Sun,
    UserRound,
} from 'lucide-react';
import { MemberAvatar } from '@/components/member-avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppearance } from '@/hooks/use-appearance';
import { forgetOfflinePages } from '@/lib/pwa';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';

export function UserMenu({
    variant = 'avatar',
}: {
    variant?: 'avatar' | 'row';
}) {
    const { auth } = usePage().props;
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const user = auth.user;

    if (!user) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'flex items-center gap-3 rounded-2xl text-left transition outline-none focus-visible:ring-4 focus-visible:ring-ring/30',
                        variant === 'row'
                            ? 'w-full p-2 hover:bg-accent/70'
                            : 'rounded-full',
                    )}
                >
                    <MemberAvatar
                        name={user.name}
                        id={user.id}
                        className={variant === 'avatar' ? 'size-10' : ''}
                    />
                    {variant === 'row' && (
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                                {user.name}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                                {user.email}
                            </span>
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                side={variant === 'row' ? 'top' : 'bottom'}
                className="w-64"
                sideOffset={8}
            >
                <DropdownMenuLabel className="font-normal">
                    <div className="truncate text-sm font-semibold">
                        {user.name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href={editProfile()}>
                        <UserRound /> Mon profil
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={editSecurity()}>
                        <ShieldCheck /> Sécurité & connexion express
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={editAppearance()}>
                        <Palette /> Apparence
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onSelect={(event) => {
                        event.preventDefault();
                        updateAppearance(
                            resolvedAppearance === 'dark' ? 'light' : 'dark',
                        );
                    }}
                >
                    {resolvedAppearance === 'dark' ? <Sun /> : <Moon />}
                    {resolvedAppearance === 'dark'
                        ? 'Mode clair'
                        : 'Mode sombre'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => {
                        router.flushAll();
                        forgetOfflinePages();
                        router.post(logout.url());
                    }}
                >
                    <LogOut /> Se déconnecter
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
