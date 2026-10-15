import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import { AnimatePresence, motion, useDragControls } from 'motion/react';
import type { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type BottomSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
    /** Decorative content shown above the title (emoji, illustration…). */
    hero?: ReactNode;
};

/**
 * A sheet that slides up from the bottom on phones (drag down to close)
 * and becomes a centered card on larger screens.
 */
export function BottomSheet({
    open,
    onOpenChange,
    title,
    description,
    children,
    footer,
    className,
    hero,
}: BottomSheetProps) {
    const isMobile = useIsMobile();
    const dragControls = useDragControls();

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <AnimatePresence>
                {open && (
                    <DialogPrimitive.Portal forceMount>
                        <DialogPrimitive.Overlay asChild forceMount>
                            <motion.div
                                className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[6px]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            />
                        </DialogPrimitive.Overlay>

                        <DialogPrimitive.Content
                            asChild
                            forceMount
                            onOpenAutoFocus={(event) => isMobile && event.preventDefault()}
                        >
                            <motion.div
                                className={cn(
                                    'fixed z-50 flex flex-col overflow-hidden border border-[var(--glass-border)] bg-popover text-popover-foreground shadow-[var(--shadow-float)] outline-none',
                                    isMobile
                                        ? 'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[30px]'
                                        : 'top-1/2 left-1/2 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[30px]',
                                    className,
                                )}
                                initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.94, y: 12 }}
                                animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
                                exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.96, y: 8 }}
                                transition={{ type: 'spring', damping: 32, stiffness: 340, mass: 0.9 }}
                                drag={isMobile ? 'y' : false}
                                dragListener={false}
                                dragControls={dragControls}
                                dragConstraints={{ top: 0, bottom: 0 }}
                                dragElastic={{ top: 0, bottom: 0.7 }}
                                onDragEnd={(_, info) => {
                                    if (info.offset.y > 110 || info.velocity.y > 600) {
                                        onOpenChange(false);
                                    }
                                }}
                            >
                                <div
                                    className="shrink-0 touch-none px-6 pt-3 pb-2"
                                    onPointerDown={(event) => isMobile && dragControls.start(event)}
                                >
                                    {isMobile && (
                                        <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-muted-foreground/25" />
                                    )}

                                    {hero && <div className="mb-3 flex justify-center pt-2">{hero}</div>}

                                    <div className="flex items-start gap-3">
                                        <div className="min-w-0 flex-1">
                                            {title ? (
                                                <DialogPrimitive.Title className="font-display text-xl font-bold">
                                                    {title}
                                                </DialogPrimitive.Title>
                                            ) : (
                                                <DialogPrimitive.Title className="sr-only">Fenêtre</DialogPrimitive.Title>
                                            )}
                                            {description ? (
                                                <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                                                    {description}
                                                </DialogPrimitive.Description>
                                            ) : (
                                                <DialogPrimitive.Description className="sr-only">
                                                    {typeof title === 'string' ? title : 'Détails'}
                                                </DialogPrimitive.Description>
                                            )}
                                        </div>

                                        {!isMobile && (
                                            <DialogPrimitive.Close className="-mt-1 -mr-2 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                                                <XIcon className="size-5" />
                                                <span className="sr-only">Fermer</span>
                                            </DialogPrimitive.Close>
                                        )}
                                    </div>
                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-2 pb-4">
                                    {children}
                                </div>

                                {footer && (
                                    <div className="pb-safe shrink-0 border-t border-[var(--hairline)] bg-popover/90 px-6 pt-3 backdrop-blur md:pb-5">
                                        {footer}
                                    </div>
                                )}
                            </motion.div>
                        </DialogPrimitive.Content>
                    </DialogPrimitive.Portal>
                )}
            </AnimatePresence>
        </DialogPrimitive.Root>
    );
}
