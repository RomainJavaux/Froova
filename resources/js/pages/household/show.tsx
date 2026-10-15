import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Check,
    Copy,
    Crown,
    DoorOpen,
    Link2,
    LogOut,
    Mail,
    MoreVertical,
    Pencil,
    Plus,
    Share2,
    ShieldCheck,
    Trash2,
    UserMinus,
    UserPlus,
    X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { HouseholdBadge } from '@/components/layout/household-switcher';
import { MemberAvatar } from '@/components/member-avatar';
import { PageHeader, SectionTitle } from '@/components/page-header';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    ColorSwatches,
    EmojiGrid,
    PLACE_EMOJIS,
} from '@/components/ui/pickers';
import { Segmented } from '@/components/ui/segmented';
import { Spinner } from '@/components/ui/spinner';
import { useClipboard } from '@/hooks/use-clipboard';
import { findColor, gradient, useCatalog } from '@/lib/catalog';
import { formatDate, timeAgo } from '@/lib/dates';
import { onboarding } from '@/routes';
import household from '@/routes/household';
import { switchMethod } from '@/routes/households';
import invitations from '@/routes/invitations';
import members from '@/routes/members';
import type { HouseholdRole } from '@/types';

type Member = {
    id: number;
    name: string;
    email: string;
    role: HouseholdRole;
    joinedAt: string | null;
    isMe: boolean;
};

type Invitation = {
    id: number;
    email: string | null;
    role: HouseholdRole;
    url: string;
    expiresAt: string;
    invitedBy: string | null;
};

type Props = {
    members: Member[];
    invitations: Invitation[];
    stats: { freezers: number; items: number; createdAt: string | null };
    can: {
        update: boolean;
        manageMembers: boolean;
        delete: boolean;
        leave: boolean;
    };
};

const ROLE_LABELS: Record<HouseholdRole, string> = {
    owner: 'Propriétaire',
    admin: 'Admin',
    member: 'Membre',
};

export default function HouseholdShow({
    members: memberList,
    invitations: pending,
    stats,
    can,
}: Props) {
    const page = usePage();
    const { household: current, households } = page.props;
    const catalog = useCatalog();
    const [sheet, setSheet] = useState<
        'edit' | 'invite' | 'delete' | 'leave' | null
    >(null);
    const [shared, setShared] = useState<{
        url: string;
        email: string | null;
        emailed: boolean;
    } | null>(null);

    useEffect(
        () =>
            router.on('flash', (event) => {
                const invitation = event.detail.flash.invitation;

                if (invitation) {
                    setShared(invitation);
                    setSheet('invite');
                }
            }),
        [],
    );

    if (!current) {
        return null;
    }

    const palette = findColor(catalog, current.color);
    const others = households.filter((item) => item.id !== current.id);

    return (
        <>
            <Head title="Mon foyer" />

            <PageHeader
                eyebrow="Mon foyer"
                title="Lieu & membres"
                description="Partage tes congélateurs avec ta famille ou tes colocs."
            />

            {/* Household card */}
            <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mb-8 overflow-hidden rounded-[32px] p-6 text-white shadow-[var(--shadow-float)] sm:p-8"
                style={{ background: gradient(palette, 135) }}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgb(255_255_255/0.35),transparent_45%)]" />
                <div className="relative flex flex-wrap items-center gap-5">
                    <motion.div
                        className="grid size-20 place-items-center rounded-[26px] bg-white/25 text-5xl shadow-inner backdrop-blur"
                        whileHover={{ rotate: -8, scale: 1.05 }}
                    >
                        {current.emoji}
                    </motion.div>
                    <div className="min-w-0 flex-1">
                        <h2 className="font-display text-3xl font-extrabold">
                            {current.name}
                        </h2>
                        <p className="mt-1 text-sm font-medium text-white/85">
                            {memberList.length} membre
                            {memberList.length > 1 ? 's' : ''} ·{' '}
                            {stats.freezers} congélateur
                            {stats.freezers > 1 ? 's' : ''} · {stats.items}{' '}
                            batchs
                            {stats.createdAt &&
                                ` · depuis ${formatDate(stats.createdAt, { month: 'long', year: 'numeric' })}`}
                        </p>
                    </div>
                    {can.update && (
                        <Button
                            variant="secondary"
                            className="bg-white/90 text-slate-900 hover:bg-white"
                            onClick={() => setSheet('edit')}
                        >
                            <Pencil className="size-4" /> Personnaliser
                        </Button>
                    )}
                </div>
            </motion.section>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-8">
                    {/* Members */}
                    <section>
                        <SectionTitle
                            title="Membres"
                            action={
                                can.manageMembers && (
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setShared(null);
                                            setSheet('invite');
                                        }}
                                    >
                                        <UserPlus className="size-4" /> Inviter
                                    </Button>
                                )
                            }
                        />
                        <div className="surface divide-y divide-[var(--hairline)] p-1">
                            <AnimatePresence initial={false}>
                                {memberList.map((member, index) => (
                                    <motion.div
                                        key={member.id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="flex items-center gap-3 p-3.5"
                                    >
                                        <MemberAvatar
                                            name={member.name}
                                            id={member.id}
                                            className="size-11 text-sm"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold">
                                                {member.name}{' '}
                                                {member.isMe && (
                                                    <span className="text-muted-foreground">
                                                        (toi)
                                                    </span>
                                                )}
                                            </p>
                                            <p className="truncate text-sm text-muted-foreground">
                                                {member.email}
                                            </p>
                                        </div>
                                        <RoleBadge role={member.role} />
                                        {can.manageMembers &&
                                            !member.isMe &&
                                            member.role !== 'owner' && (
                                                <MemberMenu member={member} />
                                            )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </section>

                    {/* Pending invitations */}
                    {can.manageMembers && pending.length > 0 && (
                        <section>
                            <SectionTitle title="Invitations en attente" />
                            <div className="space-y-2.5">
                                {pending.map((invitation) => (
                                    <PendingInvitation
                                        key={invitation.id}
                                        invitation={invitation}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <aside className="space-y-6">
                    <section>
                        <SectionTitle title="Mes autres lieux" />
                        <div className="surface space-y-1 p-2">
                            {others.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() =>
                                        router.put(switchMethod.url(item.id))
                                    }
                                    className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-accent"
                                >
                                    <HouseholdBadge
                                        emoji={item.emoji}
                                        color={item.color}
                                    />
                                    <span className="flex-1 truncate font-semibold">
                                        {item.name}
                                    </span>
                                    <span className="text-xs font-semibold text-primary">
                                        Ouvrir
                                    </span>
                                </button>
                            ))}
                            <Link
                                href={onboarding({ query: { new: 1 } })}
                                className="flex items-center gap-3 rounded-2xl p-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground"
                            >
                                <span className="grid size-10 place-items-center rounded-2xl border-2 border-dashed border-border">
                                    <Plus className="size-4" />
                                </span>
                                Créer un nouveau lieu (chalet, parents…)
                            </Link>
                        </div>
                    </section>

                    {(can.leave || can.delete) && (
                        <section className="rounded-3xl border border-destructive/20 bg-destructive/5 p-5">
                            <h3 className="font-display font-bold">
                                Zone sensible
                            </h3>
                            <div className="mt-3 flex flex-col gap-2">
                                {can.leave && (
                                    <Button
                                        variant="outline"
                                        className="justify-start"
                                        onClick={() => setSheet('leave')}
                                    >
                                        <LogOut className="size-4" /> Quitter ce
                                        lieu
                                    </Button>
                                )}
                                {can.delete && (
                                    <Button
                                        variant="outline"
                                        className="justify-start text-destructive"
                                        onClick={() => setSheet('delete')}
                                    >
                                        <Trash2 className="size-4" /> Supprimer
                                        ce lieu
                                    </Button>
                                )}
                            </div>
                        </section>
                    )}
                </aside>
            </div>

            <EditHouseholdSheet
                open={sheet === 'edit'}
                onOpenChange={(open) => setSheet(open ? 'edit' : null)}
            />
            <InviteSheet
                open={sheet === 'invite'}
                shared={shared}
                onReset={() => setShared(null)}
                onOpenChange={(open) => {
                    setSheet(open ? 'invite' : null);

                    if (!open) {
                        setShared(null);
                    }
                }}
            />
            <DeleteHouseholdSheet
                open={sheet === 'delete'}
                name={current.name}
                onOpenChange={(open) => setSheet(open ? 'delete' : null)}
            />
            <BottomSheet
                open={sheet === 'leave'}
                onOpenChange={(open) => setSheet(open ? 'leave' : null)}
                hero={<DoorOpen className="size-14 text-muted-foreground" />}
                title={
                    <span className="block text-center">
                        Quitter {current.name} ?
                    </span>
                }
                description={
                    <span className="block text-center">
                        Tu n’auras plus accès à ses congélateurs. Il faudra une
                        nouvelle invitation pour revenir.
                    </span>
                }
                footer={
                    <Button
                        variant="destructive"
                        size="lg"
                        className="w-full"
                        onClick={() => router.post(household.leave.url())}
                    >
                        Quitter
                    </Button>
                }
            >
                <div />
            </BottomSheet>
        </>
    );
}

function RoleBadge({ role }: { role: HouseholdRole }) {
    const icon =
        role === 'owner' ? (
            <Crown className="size-3" />
        ) : role === 'admin' ? (
            <ShieldCheck className="size-3" />
        ) : null;

    return (
        <span
            className={
                role === 'owner'
                    ? 'flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300'
                    : role === 'admin'
                      ? 'flex items-center gap-1 rounded-full bg-primary/12 px-2.5 py-1 text-xs font-bold text-primary'
                      : 'rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground'
            }
        >
            {icon}
            {ROLE_LABELS[role]}
        </span>
    );
}

function MemberMenu({ member }: { member: Member }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Gérer ${member.name}`}
                >
                    <MoreVertical className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                {member.role === 'member' ? (
                    <DropdownMenuItem
                        onSelect={() =>
                            router.patch(
                                members.update.url(member.id),
                                { role: 'admin' },
                                { preserveScroll: true },
                            )
                        }
                    >
                        <ShieldCheck /> Passer admin
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem
                        onSelect={() =>
                            router.patch(
                                members.update.url(member.id),
                                { role: 'member' },
                                { preserveScroll: true },
                            )
                        }
                    >
                        <ShieldCheck /> Repasser membre
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    variant="destructive"
                    onSelect={() =>
                        router.delete(members.destroy.url(member.id), {
                            preserveScroll: true,
                        })
                    }
                >
                    <UserMinus /> Retirer du foyer
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function PendingInvitation({ invitation }: { invitation: Invitation }) {
    const [copied, copy] = useClipboard();

    return (
        <div className="surface flex items-center gap-3 p-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-muted">
                {invitation.email ? (
                    <Mail className="size-5 text-muted-foreground" />
                ) : (
                    <Link2 className="size-5 text-muted-foreground" />
                )}
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                    {invitation.email ?? 'Lien d’invitation'}
                </p>
                <p className="text-xs text-muted-foreground">
                    {ROLE_LABELS[invitation.role]} · expire{' '}
                    {timeAgo(invitation.expiresAt)}
                </p>
            </div>
            <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => copy(invitation.url)}
                aria-label="Copier le lien"
            >
                {copied ? (
                    <Check className="size-4 text-emerald-500" />
                ) : (
                    <Copy className="size-4" />
                )}
            </Button>
            <Button
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                    router.delete(invitations.destroy.url(invitation.id), {
                        preserveScroll: true,
                    })
                }
                aria-label="Annuler l’invitation"
            >
                <X className="size-4" />
            </Button>
        </div>
    );
}

function InviteSheet({
    open,
    shared,
    onOpenChange,
    onReset,
}: {
    open: boolean;
    shared: { url: string; email: string | null; emailed: boolean } | null;
    onOpenChange: (open: boolean) => void;
    onReset: () => void;
}) {
    const form = useForm<{ email: string; role: 'member' | 'admin' }>({
        email: '',
        role: 'member',
    });
    const [qr, setQr] = useState<string | null>(null);
    const [copied, copy] = useClipboard();

    useEffect(() => {
        if (shared) {
            void QRCode.toDataURL(shared.url, {
                margin: 1,
                width: 440,
                color: { dark: '#1e1b4b', light: '#ffffff' },
            }).then(setQr);
        } else {
            setQr(null);
        }
    }, [shared]);

    const share = async () => {
        if (!shared) {
            return;
        }

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Rejoins-moi sur Froova',
                    text: 'Je t’invite à partager nos congélateurs sur Froova ❄️',
                    url: shared.url,
                });
            } catch {
                // The user closed the share sheet.
            }
        } else {
            void copy(shared.url);
        }
    };

    return (
        <BottomSheet
            open={open}
            onOpenChange={onOpenChange}
            title={shared ? 'Invitation prête ! 🎉' : 'Inviter quelqu’un'}
            description={
                shared
                    ? 'Fais scanner le QR code ou envoie le lien. Il est valable 7 jours.'
                    : 'Crée un lien à partager, et envoie-le par e-mail si tu veux.'
            }
        >
            <AnimatePresence mode="wait">
                {shared ? (
                    <motion.div
                        key="shared"
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4 pb-2"
                    >
                        <div className="mx-auto grid aspect-square w-full max-w-[240px] place-items-center rounded-3xl bg-white p-3 shadow-[var(--shadow-float)]">
                            {qr ? (
                                <img
                                    src={qr}
                                    alt="QR code d’invitation"
                                    className="size-full"
                                />
                            ) : (
                                <Spinner />
                            )}
                        </div>
                        {shared.email && (
                            <p className="text-center text-sm text-muted-foreground">
                                {shared.emailed
                                    ? `✉️ E-mail envoyé à ${shared.email}`
                                    : `L’e-mail n’a pas pu partir : partage le lien à ${shared.email}.`}
                            </p>
                        )}
                        <div className="flex items-center gap-2 rounded-2xl bg-muted p-2 pl-4">
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                {shared.url}
                            </span>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => copy(shared.url)}
                            >
                                {copied ? (
                                    <Check className="size-4" />
                                ) : (
                                    <Copy className="size-4" />
                                )}{' '}
                                {copied ? 'Copié' : 'Copier'}
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="lg"
                                className="flex-1"
                                onClick={onReset}
                            >
                                Nouvelle
                            </Button>
                            <Button
                                size="lg"
                                className="flex-[2]"
                                onClick={share}
                            >
                                <Share2 className="size-5" /> Partager
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.form
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4 pb-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post(invitations.store.url(), {
                                preserveScroll: true,
                                onSuccess: () => form.reset(),
                            });
                        }}
                    >
                        <div className="space-y-1.5">
                            <label
                                className="text-sm font-semibold"
                                htmlFor="invite-email"
                            >
                                E-mail (facultatif)
                            </label>
                            <Input
                                id="invite-email"
                                type="email"
                                value={form.data.email}
                                onChange={(event) =>
                                    form.setData('email', event.target.value)
                                }
                                placeholder="camille@exemple.fr"
                            />
                            <InputError message={form.errors.email} />
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-sm font-semibold">Rôle</span>
                            <Segmented
                                className="flex w-full"
                                value={form.data.role}
                                onChange={(role) => form.setData('role', role)}
                                options={[
                                    { value: 'member', label: 'Membre' },
                                    { value: 'admin', label: 'Admin' },
                                ]}
                            />
                            <p className="text-xs text-muted-foreground">
                                {form.data.role === 'admin'
                                    ? 'Peut aussi inviter et gérer les membres.'
                                    : 'Peut ranger, prendre et configurer les congélateurs.'}
                            </p>
                        </div>
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            disabled={form.processing}
                        >
                            {form.processing ? (
                                <Spinner />
                            ) : (
                                <Link2 className="size-5" />
                            )}{' '}
                            Créer le lien d’invitation
                        </Button>
                    </motion.form>
                )}
            </AnimatePresence>
        </BottomSheet>
    );
}

function EditHouseholdSheet({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { household: current } = usePage().props;
    const catalog = useCatalog();
    const form = useForm({
        name: current?.name ?? '',
        emoji: current?.emoji ?? '🏠',
        color: current?.color ?? 'frost',
    });

    return (
        <BottomSheet
            open={open}
            onOpenChange={onOpenChange}
            title="Personnaliser le lieu"
            footer={
                <Button
                    size="lg"
                    className="w-full"
                    disabled={form.processing}
                    onClick={() =>
                        form.patch(household.update.url(), {
                            preserveScroll: true,
                            onSuccess: () => onOpenChange(false),
                        })
                    }
                >
                    {form.processing ? (
                        <Spinner />
                    ) : (
                        <Check className="size-5" />
                    )}{' '}
                    Enregistrer
                </Button>
            }
        >
            <div className="space-y-5">
                <div className="flex items-center gap-3">
                    <span
                        className="grid size-14 shrink-0 place-items-center rounded-2xl text-3xl"
                        style={{
                            background: gradient(
                                findColor(catalog, form.data.color),
                            ),
                        }}
                    >
                        {form.data.emoji}
                    </span>
                    <Input
                        value={form.data.name}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                        className="h-14 text-lg font-bold"
                        maxLength={60}
                    />
                </div>
                <InputError message={form.errors.name} />
                <EmojiGrid
                    emojis={PLACE_EMOJIS}
                    value={form.data.emoji}
                    onChange={(emoji) => form.setData('emoji', emoji)}
                />
                <ColorSwatches
                    colors={catalog.palette}
                    value={form.data.color}
                    onChange={(color) => form.setData('color', color)}
                />
            </div>
        </BottomSheet>
    );
}

function DeleteHouseholdSheet({
    open,
    name,
    onOpenChange,
}: {
    open: boolean;
    name: string;
    onOpenChange: (open: boolean) => void;
}) {
    const form = useForm({ confirmation: '' });

    return (
        <BottomSheet
            open={open}
            onOpenChange={onOpenChange}
            hero={<span className="text-6xl">🧨</span>}
            title={
                <span className="block text-center">Supprimer {name} ?</span>
            }
            description={
                <span className="block text-center">
                    Congélateurs, batchs, photos et historique seront effacés
                    pour tous les membres.
                </span>
            }
            footer={
                <Button
                    variant="destructive"
                    size="lg"
                    className="w-full"
                    disabled={
                        form.processing || form.data.confirmation !== name
                    }
                    onClick={() => form.delete(household.destroy.url())}
                >
                    <Trash2 className="size-5" /> Supprimer définitivement
                </Button>
            }
        >
            <div className="space-y-2 pb-2">
                <label className="text-sm font-semibold">
                    Tape <strong>{name}</strong> pour confirmer
                </label>
                <Input
                    value={form.data.confirmation}
                    onChange={(event) =>
                        form.setData('confirmation', event.target.value)
                    }
                />
                <InputError message={form.errors.confirmation} />
            </div>
        </BottomSheet>
    );
}
