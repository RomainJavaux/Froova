import { Form, Head, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { MemberAvatar } from '@/components/member-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function Profile() {
    const { auth } = usePage().props;
    const user = auth.user;

    if (!user) {
        return null;
    }

    return (
        <>
            <Head title="Profil" />

            <div className="surface space-y-6 p-5 sm:p-6">
                <div className="flex items-center gap-4">
                    <MemberAvatar
                        name={user.name}
                        id={user.id}
                        className="size-16 text-xl"
                    />
                    <Heading
                        variant="small"
                        title="Profil"
                        description="Ton nom est visible par les membres de tes lieux."
                    />
                </div>

                <Form
                    {...ProfileController.update.form()}
                    options={{ preserveScroll: true }}
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nom</Label>
                                <Input
                                    id="name"
                                    defaultValue={user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Adresse e-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    defaultValue={user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <Button
                                disabled={processing}
                                data-test="update-profile-button"
                            >
                                {processing && <Spinner />} Enregistrer
                            </Button>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}
