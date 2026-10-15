import { router } from '@inertiajs/react';
import { Fingerprint } from 'lucide-react';
import { destroy } from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController';
import Heading from '@/components/heading';
import PasskeyItem from '@/components/passkey-item';
import PasskeyRegistration from '@/components/passkey-register';
import type { Passkey } from '@/types/auth';

export type Props = {
    canManagePasskeys?: boolean;
    passkeys?: Passkey[];
};

export default function ManagePasskeys(props: Props) {
    const passkeys = props.passkeys ?? [];

    const handleDelete = (id: number, onError: () => void) => {
        router.delete(destroy.url(id), {
            preserveScroll: true,
            onError,
        });
    };

    if (!(props.canManagePasskeys ?? false)) {
        return null;
    }

    return (
        <div className="surface space-y-6 overflow-hidden p-5 sm:p-6">
            <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-white shadow-[0_10px_24px_-10px_rgb(16_185_129)]">
                    <Fingerprint className="size-6" />
                </span>
                <Heading
                    variant="small"
                    title="Connexion express"
                    description="Ajoute une passkey sur chacun de tes appareils : tu te connecteras avec Face ID, ton empreinte ou le code de ton téléphone, sans mot de passe."
                />
            </div>

            {passkeys.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-border">
                    {passkeys.map((passkey) => (
                        <PasskeyItem
                            key={passkey.id}
                            passkey={passkey}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            ) : (
                <p className="rounded-2xl bg-muted/70 px-4 py-3 text-sm text-muted-foreground">
                    Aucune passkey pour l’instant.
                </p>
            )}

            <PasskeyRegistration onSuccess={() => router.reload()} />
        </div>
    );
}
