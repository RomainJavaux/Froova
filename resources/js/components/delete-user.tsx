import { Form } from '@inertiajs/react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-4 rounded-3xl border border-destructive/20 bg-destructive/5 p-5 sm:p-6">
            <Heading
                variant="small"
                title="Supprimer mon compte"
                description="Ton compte et tes lieux dont tu es propriétaire seront effacés. C’est définitif."
            />

            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant="destructive"
                        data-test="delete-user-button"
                    >
                        Supprimer mon compte
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle className="font-display text-xl font-bold">
                        Supprimer ton compte ?
                    </DialogTitle>
                    <DialogDescription>
                        Saisis ton mot de passe pour confirmer. Les lieux que tu
                        possèdes seront supprimés pour tous leurs membres.
                    </DialogDescription>

                    <Form
                        {...ProfileController.destroy.form()}
                        options={{ preserveScroll: true }}
                        onError={() => passwordInput.current?.focus()}
                        resetOnSuccess
                        className="space-y-6"
                    >
                        {({ resetAndClearErrors, processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="password"
                                        className="sr-only"
                                    >
                                        Mot de passe
                                    </Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        ref={passwordInput}
                                        placeholder="Mot de passe"
                                        autoComplete="current-password"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                        <Button
                                            variant="secondary"
                                            onClick={() =>
                                                resetAndClearErrors()
                                            }
                                        >
                                            Annuler
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        variant="destructive"
                                        disabled={processing}
                                        asChild
                                    >
                                        <button
                                            type="submit"
                                            data-test="confirm-delete-user-button"
                                        >
                                            Supprimer
                                        </button>
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
