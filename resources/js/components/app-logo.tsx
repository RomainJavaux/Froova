import AppLogoIcon from '@/components/app-logo-icon';
import { cn } from '@/lib/utils';

export default function AppLogo({
    className,
    compact = false,
}: {
    className?: string;
    compact?: boolean;
}) {
    return (
        <span className={cn('inline-flex items-center gap-2.5', className)}>
            <AppLogoIcon className="size-9 shrink-0 drop-shadow-[0_6px_14px_rgb(99_102_241/0.35)]" />
            {!compact && (
                <span className="font-display text-[22px] leading-none font-extrabold tracking-tight">
                    froova
                </span>
            )}
        </span>
    );
}
