import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    const [remember, setRemember] = useState(true);

    return (
        <>
            <Head title="Créer un compte" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Prénom ou surnom</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="given-name"
                                    name="name"
                                    placeholder="Camille"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Adresse e-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="toi@exemple.fr"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Mot de passe</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="8 caractères minimum"
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirmation
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Le même, encore une fois"
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <label
                                htmlFor="remember"
                                className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-muted/70 px-4 py-3"
                            >
                                <span>
                                    <span className="block text-sm font-semibold">
                                        Rester connecté
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                        Recommandé sur ton téléphone.
                                    </span>
                                </span>
                                <Switch
                                    id="remember"
                                    name="remember"
                                    checked={remember}
                                    onCheckedChange={setRemember}
                                />
                            </label>

                            <Button
                                type="submit"
                                size="lg"
                                variant="warm"
                                className="mt-2 w-full"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Créer mon compte
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Déjà inscrit ?{' '}
                            <TextLink href={login()} tabIndex={6}>
                                Se connecter
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Bienvenue sur Froova ❄️',
    description: 'Crée ton compte, puis ton lieu et ton premier congélateur.',
};
