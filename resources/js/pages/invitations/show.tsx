import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, Clock, Snowflake } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import AppLogo from '@/components/app-logo';
import { Aurora, Snowfall } from '@/components/fx/aurora';
import { MemberAvatar } from '@/components/member-avatar';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { findColor, gradient, useCatalog } from '@/lib/catalog';
import { dashboard, login, register } from '@/routes';
import invitations from '@/routes/invitations';

type Props = {
    token: string;
    invitation: {
        status: 'pending' | 'accepted' | 'expired';
        email: string | null;
        invitedBy: string | null;
        household: {
            name: string;
            emoji: string;
            color: string;
            members: { id: number; name: string }[];
            freezers: number;
        };
        alreadyMember: boolean;
    } | null;
};

export default function InvitationShow({ token, invitation }: Props) {
    const { auth } = usePage().props;
    const catalog = useCatalog();
    const [joining, setJoining] = useState(false);

    const valid = invitation && invitation.status === 'pending';
    const palette = findColor(catalog, invitation?.household.color);

    return (
        <div className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-10">
            <Head title="Invitation" />
            <Aurora />

            <Link href="/" className="mb-8">
                <AppLogo />
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                className="glass-strong w-full max-w-md overflow-hidden rounded-[36px] shadow-[var(--shadow-float)]"
            >
                {invitation ? (
                    <>
                        <div
                            className="relative overflow-hidden px-6 pt-10 pb-8 text-center text-white"
                            style={{ background: gradient(palette) }}
                        >
                            <Snowfall count={16} />
                            <motion.div
                                initial={{ scale: 0, rotate: -40 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    delay: 0.25,
                                    type: 'spring',
                                    stiffness: 260,
                                    damping: 14,
                                }}
                                className="relative mx-auto grid size-24 place-items-center rounded-[30px] bg-white/25 text-6xl shadow-inner backdrop-blur"
                            >
                                {invitation.household.emoji}
                            </motion.div>
                            <p className="relative mt-5 text-sm font-semibold text-white/85">
                                {invitation.invitedBy
                                    ? `${invitation.invitedBy} t’invite à rejoindre`
                                    : 'Tu es invité·e à rejoindre'}
                            </p>
                            <h1 className="relative mt-1 font-display text-3xl font-extrabold">
                                {invitation.household.name}
                            </h1>
                            <div className="relative mt-5 flex items-center justify-center">
                                <div className="flex -space-x-2">
                                    {invitation.household.members
                                        .slice(0, 5)
                                        .map((member) => (
                                            <MemberAvatar
                                                key={member.id}
                                                name={member.name}
                                                id={member.id}
                                                className="ring-white/70"
                                            />
                                        ))}
                                </div>
                                <span className="ml-3 text-sm font-medium text-white/90">
                                    <Snowflake className="mr-1 inline size-3.5" />
                                    {invitation.household.freezers} congélateur
                                    {invitation.household.freezers > 1
                                        ? 's'
                                        : ''}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 p-6">
                            {invitation.alreadyMember ? (
                                <>
                                    <p className="text-center text-muted-foreground">
                                        Tu fais déjà partie de ce lieu 🎉
                                    </p>
                                    <Button
                                        size="lg"
                                        className="w-full"
                                        onClick={() =>
                                            router.post(
                                                invitations.accept.url(token),
                                            )
                                        }
                                    >
                                        Y aller{' '}
                                        <ArrowRight className="size-5" />
                                    </Button>
                                </>
                            ) : !valid ? (
                                <div className="py-2 text-center">
                                    <Clock className="mx-auto size-10 text-muted-foreground" />
                                    <p className="mt-3 font-display text-lg font-bold">
                                        {invitation.status === 'expired'
                                            ? 'Cette invitation a expiré'
                                            : 'Cette invitation a déjà été utilisée'}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Demande un nouveau lien à{' '}
                                        {invitation.invitedBy ??
                                            'la personne qui t’a invité·e'}
                                        .
                                    </p>
                                </div>
                            ) : auth.user ? (
                                <>
                                    <Button
                                        size="lg"
                                        className="w-full"
                                        disabled={joining}
                                        onClick={() =>
                                            router.post(
                                                invitations.accept.url(token),
                                                {},
                                                {
                                                    onStart: () =>
                                                        setJoining(true),
                                                    onFinish: () =>
                                                        setJoining(false),
                                                },
                                            )
                                        }
                                    >
                                        {joining ? (
                                            <Spinner />
                                        ) : (
                                            <span>❄️</span>
                                        )}{' '}
                                        Rejoindre {invitation.household.name}
                                    </Button>
                                    <p className="text-center text-xs text-muted-foreground">
                                        Connecté·e en tant que {auth.user.email}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Button
                                        asChild
                                        size="lg"
                                        className="w-full"
                                    >
                                        <Link href={register()}>
                                            Créer mon compte
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="lg"
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <Link href={login()}>
                                            J’ai déjà un compte
                                        </Link>
                                    </Button>
                                    <p className="pt-1 text-center text-xs text-muted-foreground">
                                        Tu reviendras ici automatiquement après.
                                    </p>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="p-10 text-center">
                        <div className="text-6xl">🤔</div>
                        <h1 className="mt-4 font-display text-2xl font-extrabold">
                            Lien introuvable
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            Ce lien d’invitation n’existe pas ou a été annulé.
                        </p>
                        <Button asChild className="mt-6">
                            <Link href={auth.user ? dashboard() : '/'}>
                                Retour à l’accueil
                            </Link>
                        </Button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
