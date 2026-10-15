import { Download, Share, Smartphone, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { isIos, isStandalone, useInstallPrompt } from '@/lib/pwa';

const STORAGE_KEY = 'froova:install-dismissed';

function readDismissed(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

/**
 * Invites the user to add Froova to their home screen (native prompt or iOS instructions).
 */
export function InstallBanner() {
    const { canPrompt, install } = useInstallPrompt();
    const [dismissed, setDismissed] = useState(true);
    const [ios, setIos] = useState(false);

    useEffect(() => {
        setDismissed(readDismissed() || isStandalone());
        setIos(isIos());
    }, []);

    const visible = !dismissed && (canPrompt || ios);

    const dismiss = () => {
        setDismissed(true);

        try {
            localStorage.setItem(STORAGE_KEY, '1');
        } catch {
            // Private mode: the banner simply comes back next time.
        }
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 16, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="overflow-hidden"
                >
                    <div className="relative mb-6 flex items-center gap-4 overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#0ea5e9,#6366f1_55%,#8b5cf6)] p-4 text-white shadow-[var(--shadow-float)] sm:p-5">
                        <div className="absolute -top-10 -right-6 size-40 rounded-full bg-white/15 blur-2xl" />
                        <motion.div
                            className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur"
                            animate={{ rotate: [0, -8, 8, 0] }}
                            transition={{
                                duration: 2.4,
                                repeat: Infinity,
                                repeatDelay: 2,
                            }}
                        >
                            <Smartphone className="size-7" />
                        </motion.div>
                        <div className="relative min-w-0 flex-1">
                            <p className="font-display text-base font-bold">
                                Installe Froova sur ton téléphone
                            </p>
                            <p className="text-sm text-white/85">
                                {ios && !canPrompt ? (
                                    <>
                                        Touche{' '}
                                        <Share className="inline size-3.5 align-[-2px]" />{' '}
                                        puis « Sur l’écran d’accueil ».
                                    </>
                                ) : (
                                    'Un accès en un geste, même en plein rangement des courses.'
                                )}
                            </p>
                        </div>
                        {canPrompt && (
                            <Button
                                size="sm"
                                className="relative bg-white text-indigo-600 shadow-none hover:bg-white/90"
                                onClick={async () => {
                                    if (await install()) {
                                        dismiss();
                                    }
                                }}
                            >
                                <Download className="size-4" /> Installer
                            </Button>
                        )}
                        <button
                            type="button"
                            onClick={dismiss}
                            className="relative -mr-1 rounded-full p-1.5 text-white/75 transition hover:bg-white/15 hover:text-white"
                            aria-label="Masquer"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
