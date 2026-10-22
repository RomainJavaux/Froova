import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Expand, X } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The whole dish photo, never cropped: it sits on a blurred copy of itself
 * to fill the frame, and opens full screen on tap.
 */
export function PhotoHero({
    src,
    alt,
    children,
    className,
}: {
    src: string;
    alt: string;
    /** Overlay (badges) drawn at the bottom of the photo. */
    children?: ReactNode;
    className?: string;
}) {
    const [open, setOpen] = useState(false);

    return (
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
            <div
                className={cn(
                    'relative isolate overflow-hidden bg-slate-900',
                    className,
                )}
            >
                <img
                    src={src}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 -z-10 size-full scale-125 object-cover opacity-70 blur-2xl"
                />
                <DialogPrimitive.Trigger asChild>
                    <button
                        type="button"
                        className="group block w-full cursor-zoom-in"
                        aria-label="Voir la photo en grand"
                    >
                        <img
                            src={src}
                            alt={alt}
                            className="mx-auto max-h-[min(55svh,480px)] min-h-56 w-auto max-w-full object-contain sm:max-h-[min(68svh,560px)] sm:min-h-72"
                        />
                        <span className="absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-black/40 text-white opacity-80 backdrop-blur transition group-hover:opacity-100">
                            <Expand className="size-4" />
                        </span>
                    </button>
                </DialogPrimitive.Trigger>
                {children}
            </div>

            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    className="fixed inset-0 z-50 grid place-items-center p-3 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:p-8"
                    onClick={() => setOpen(false)}
                >
                    <DialogPrimitive.Title className="sr-only">
                        {alt}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">
                        Photo en grand
                    </DialogPrimitive.Description>
                    <img
                        src={src}
                        alt={alt}
                        className="size-full object-contain"
                    />
                    <DialogPrimitive.Close
                        className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 grid size-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                        aria-label="Fermer"
                    >
                        <X className="size-5" />
                    </DialogPrimitive.Close>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
