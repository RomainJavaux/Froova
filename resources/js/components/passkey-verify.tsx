import type { UrlMethodPair } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { usePasskeyVerify } from '@laravel/passkeys/react';
import { Fingerprint } from 'lucide-react';
import { motion } from 'motion/react';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    routes?: {
        options: UrlMethodPair;
        submit: UrlMethodPair;
    };
    label?: string;
    loadingLabel?: string;
    separator?: string;
};

/**
 * Face ID / fingerprint / phone screen-lock sign-in.
 */
export default function PasskeyVerify({
    routes,
    label,
    loadingLabel,
    separator,
}: Props = {}) {
    const { verify, isLoading, error, isSupported } = usePasskeyVerify({
        ...(routes && {
            routes: {
                options: routes.options.url,
                submit: routes.submit.url,
            },
        }),
        onSuccess: (response) => {
            router.visit(response.redirect ?? '/dashboard');
        },
    });

    if (!isSupported) {
        return null;
    }

    return (
        <>
            <div className="grid gap-2">
                <motion.button
                    type="button"
                    onClick={verify}
                    disabled={isLoading}
                    whileTap={{ scale: 0.97 }}
                    className="group relative flex h-16 w-full items-center gap-4 overflow-hidden rounded-2xl border border-emerald-500/25 bg-emerald-500/8 px-4 text-left transition hover:bg-emerald-500/12 disabled:opacity-60"
                >
                    <span className="grid size-10 place-items-center rounded-xl bg-emerald-500 text-white shadow-[0_8px_20px_-8px_rgb(16_185_129)]">
                        {isLoading ? (
                            <Spinner className="size-5" />
                        ) : (
                            <Fingerprint className="size-5" />
                        )}
                    </span>
                    <span className="flex-1">
                        <span className="block font-bold">
                            {isLoading
                                ? (loadingLabel ?? 'Vérification…')
                                : (label ?? 'Connexion express')}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                            Face ID, empreinte ou code du téléphone
                        </span>
                    </span>
                </motion.button>
                {error && (
                    <InputError message={error} className="text-center" />
                )}
            </div>

            <div className="relative my-7">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs font-semibold tracking-wide uppercase">
                    <span className="bg-background px-3 text-muted-foreground">
                        {separator ?? 'ou avec ton e-mail'}
                    </span>
                </div>
            </div>
        </>
    );
}
