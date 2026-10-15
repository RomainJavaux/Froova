import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { useIsMobile } from '@/hooks/use-mobile';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { resolvedAppearance } = useAppearance();
    const isMobile = useIsMobile();

    useFlashToast();

    return (
        <Sonner
            theme={resolvedAppearance}
            className="toaster group"
            position={isMobile ? 'top-center' : 'bottom-right'}
            offset={isMobile ? 16 : 24}
            toastOptions={{
                classNames: {
                    toast: '!rounded-2xl !border-[var(--glass-border)] !bg-[var(--glass-strong)] !backdrop-blur-xl !shadow-[var(--shadow-float)] !font-sans !text-[14px] !font-medium',
                },
            }}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
