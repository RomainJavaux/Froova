import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import AppLogo from '@/components/app-logo';
import {
    FreezerConfigurator,
    defaultCompartmentNames,
    draftKey,
} from '@/components/freezer/freezer-configurator';
import type { FreezerDraft } from '@/components/freezer/freezer-configurator';
import { FreezerVisual } from '@/components/freezer/freezer-visual';
import { Aurora, Snowfall } from '@/components/fx/aurora';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ColorSwatches,
    EmojiGrid,
    PLACE_EMOJIS,
} from '@/components/ui/pickers';
import { Spinner } from '@/components/ui/spinner';
import { findColor, gradient, useCatalog } from '@/lib/catalog';
import { celebrate } from '@/lib/celebrate';
import { dashboard } from '@/routes';
import onboarding from '@/routes/onboarding';

type FormData = {
    household: { name: string; emoji: string; color: string };
    freezer: FreezerDraft | null;
};

const STEPS = ['welcome', 'place', 'freezer'] as const;

export default function Onboarding({
    isAdditional,
}: {
    isAdditional: boolean;
}) {
    const { auth } = usePage().props;
    const catalog = useCatalog();
    const [step, setStep] = useState(isAdditional ? 1 : 0);
    const [direction, setDirection] = useState(1);
    const [withFreezer, setWithFreezer] = useState(true);

    const form = useForm<FormData>({
        household: {
            name: isAdditional ? '' : 'Ma maison',
            emoji: isAdditional ? '🏔️' : '🏡',
            color: 'frost',
        },
        freezer: {
            name: 'Congel cuisine',
            type: 'upright',
            color: 'frost',
            location: 'Cuisine',
            compartments: defaultCompartmentNames('Tiroir', 5, 'upright').map(
                (name) => ({ key: draftKey(), name }),
            ),
        },
    });

    const go = (next: number) => {
        setDirection(next > step ? 1 : -1);
        setStep(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const submit = (includeFreezer: boolean) => {
        setWithFreezer(includeFreezer);
        form.transform((data) => ({
            ...data,
            freezer: includeFreezer ? data.freezer : null,
        }));
        form.post(onboarding.store.url(), {
            onSuccess: () => celebrate(),
            onError: (errors) => {
                if (
                    Object.keys(errors).some((key) =>
                        key.startsWith('household'),
                    )
                ) {
                    go(1);
                }
            },
        });
    };

    const palette = findColor(catalog, form.data.household.color);
    const firstName = auth.user?.name.split(' ')[0];

    return (
        <div className="relative min-h-dvh overflow-x-hidden">
            <Head title="Bienvenue" />
            <Aurora />

            <header className="pt-safe mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
                <AppLogo />
                {isAdditional ? (
                    <Link
                        href={dashboard()}
                        className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                    >
                        Annuler
                    </Link>
                ) : (
                    <div className="flex gap-1.5">
                        {STEPS.map((name, index) => (
                            <motion.span
                                key={name}
                                className="h-2 rounded-full bg-primary"
                                animate={{
                                    width: index === step ? 28 : 8,
                                    opacity: index <= step ? 1 : 0.25,
                                }}
                            />
                        ))}
                    </div>
                )}
            </header>

            <main className="mx-auto max-w-5xl px-5 pb-16">
                <AnimatePresence mode="wait" custom={direction}>
                    {step === 0 && (
                        <StepFrame key="welcome" direction={direction}>
                            <div className="grid items-center gap-10 py-6 lg:grid-cols-2 lg:py-16">
                                <div className="relative order-2 mx-auto w-full max-w-sm lg:order-1">
                                    <div className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle,rgb(99_102_241/0.35),transparent_70%)]" />
                                    <FreezerVisual
                                        type="upright"
                                        color="frost"
                                        name="Froova"
                                        size="lg"
                                        animateOpening
                                        compartments={[
                                            {
                                                id: 1,
                                                name: 'Plats du soir',
                                                itemsCount: 12,
                                                previewEmojis: [
                                                    '🍝',
                                                    '🍛',
                                                    '🥘',
                                                ],
                                            },
                                            {
                                                id: 2,
                                                name: 'Soupes',
                                                itemsCount: 6,
                                                previewEmojis: ['🥣', '🎃'],
                                            },
                                            {
                                                id: 3,
                                                name: 'Viandes & poissons',
                                                itemsCount: 8,
                                                previewEmojis: [
                                                    '🍗',
                                                    '🐟',
                                                    '🥩',
                                                ],
                                            },
                                            {
                                                id: 4,
                                                name: 'Desserts',
                                                itemsCount: 5,
                                                previewEmojis: ['🍪', '🍨'],
                                            },
                                        ]}
                                    />
                                </div>
                                <div className="order-1 text-center lg:order-2 lg:text-left">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{
                                            scale: 1,
                                            rotate: [0, 14, -8, 14, 0],
                                        }}
                                        transition={{ delay: 0.2, duration: 1 }}
                                        className="mb-4 text-6xl"
                                    >
                                        👋
                                    </motion.div>
                                    <h1 className="font-display text-4xl leading-tight font-extrabold sm:text-5xl">
                                        Bienvenue
                                        {firstName ? `, ${firstName}` : ''} !
                                    </h1>
                                    <p className="mt-4 text-lg text-muted-foreground">
                                        En deux minutes, on configure ton lieu
                                        et ton congélateur. Ensuite, chaque
                                        batch aura sa place — et tu sauras
                                        toujours où se cache la dernière part de
                                        lasagnes.
                                    </p>
                                    <Button
                                        size="lg"
                                        className="mt-8 w-full sm:w-auto"
                                        onClick={() => go(1)}
                                    >
                                        C’est parti{' '}
                                        <ArrowRight className="size-5" />
                                    </Button>
                                </div>
                            </div>
                        </StepFrame>
                    )}

                    {step === 1 && (
                        <StepFrame key="place" direction={direction}>
                            <div className="mx-auto max-w-xl py-4">
                                <p className="text-sm font-semibold text-primary">
                                    {isAdditional
                                        ? 'Nouveau lieu'
                                        : 'Étape 1 sur 2'}
                                </p>
                                <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
                                    Comment s’appelle ton lieu ?
                                </h1>
                                <p className="mt-2 text-muted-foreground">
                                    La maison, l’appart, le chalet… Tu pourras y
                                    inviter ta famille.
                                </p>

                                <motion.div
                                    layout
                                    className="relative mt-8 overflow-hidden rounded-[32px] p-6 text-white shadow-[var(--shadow-float)]"
                                    style={{ background: gradient(palette) }}
                                >
                                    <Snowfall count={10} />
                                    <div className="relative flex items-center gap-4">
                                        <motion.span
                                            key={form.data.household.emoji}
                                            initial={{
                                                scale: 0.4,
                                                rotate: -30,
                                            }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            className="grid size-16 place-items-center rounded-3xl bg-white/25 text-4xl backdrop-blur"
                                        >
                                            {form.data.household.emoji}
                                        </motion.span>
                                        <span className="truncate font-display text-2xl font-extrabold">
                                            {form.data.household.name ||
                                                'Mon lieu'}
                                        </span>
                                    </div>
                                </motion.div>

                                <div className="mt-6 space-y-6">
                                    <div>
                                        <Input
                                            value={form.data.household.name}
                                            onChange={(event) =>
                                                form.setData('household', {
                                                    ...form.data.household,
                                                    name: event.target.value,
                                                })
                                            }
                                            placeholder="Ma maison"
                                            className="h-14 text-lg font-bold"
                                            maxLength={60}
                                            autoFocus
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={
                                                form.errors['household.name']
                                            }
                                        />
                                    </div>
                                    <EmojiGrid
                                        emojis={PLACE_EMOJIS}
                                        value={form.data.household.emoji}
                                        onChange={(emoji) =>
                                            form.setData('household', {
                                                ...form.data.household,
                                                emoji,
                                            })
                                        }
                                    />
                                    <ColorSwatches
                                        colors={catalog.palette}
                                        value={form.data.household.color}
                                        onChange={(color) =>
                                            form.setData('household', {
                                                ...form.data.household,
                                                color,
                                            })
                                        }
                                    />
                                </div>

                                <div className="mt-10 flex gap-3">
                                    {!isAdditional && (
                                        <Button
                                            variant="secondary"
                                            size="lg"
                                            onClick={() => go(0)}
                                        >
                                            <ArrowLeft className="size-5" />
                                        </Button>
                                    )}
                                    <Button
                                        size="lg"
                                        className="flex-1"
                                        disabled={
                                            !form.data.household.name.trim()
                                        }
                                        onClick={() => go(2)}
                                    >
                                        Continuer{' '}
                                        <ArrowRight className="size-5" />
                                    </Button>
                                </div>
                            </div>
                        </StepFrame>
                    )}

                    {step === 2 && form.data.freezer && (
                        <StepFrame key="freezer" direction={direction}>
                            <div className="py-4">
                                <p className="text-sm font-semibold text-primary">
                                    {isAdditional
                                        ? 'Dernière étape'
                                        : 'Étape 2 sur 2'}
                                </p>
                                <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
                                    Ton premier congélateur
                                </h1>
                                <p className="mt-2 text-muted-foreground">
                                    Choisis son type et son nombre de tiroirs.
                                    Tu pourras tout modifier plus tard.
                                </p>

                                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
                                    <FreezerConfigurator
                                        value={form.data.freezer}
                                        onChange={(freezer) =>
                                            form.setData('freezer', freezer)
                                        }
                                        errors={form.errors}
                                        errorPrefix="freezer."
                                    />
                                    <div className="order-first lg:order-last">
                                        <div className="surface sticky top-6 px-6 pt-6 pb-8">
                                            <p className="mb-5 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                Aperçu
                                            </p>
                                            <FreezerVisual
                                                type={form.data.freezer.type}
                                                color={form.data.freezer.color}
                                                name={
                                                    form.data.freezer.name ||
                                                    'Mon congélateur'
                                                }
                                                compartments={form.data.freezer.compartments.map(
                                                    (compartment) => ({
                                                        id: compartment.key,
                                                        name:
                                                            compartment.name ||
                                                            '…',
                                                    }),
                                                )}
                                                size="md"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pb-safe sticky bottom-0 z-10 -mx-5 mt-10 flex flex-col-reverse gap-3 border-t border-[var(--hairline)] bg-background/85 px-5 pt-4 backdrop-blur-xl sm:flex-row sm:items-center">
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        onClick={() => go(1)}
                                        disabled={form.processing}
                                    >
                                        <ArrowLeft className="size-5" />
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => submit(false)}
                                        disabled={form.processing}
                                        className="text-sm font-semibold text-muted-foreground hover:text-foreground sm:ml-auto"
                                    >
                                        Je le ferai plus tard
                                    </button>
                                    <Button
                                        size="lg"
                                        variant="warm"
                                        className="sm:w-72"
                                        onClick={() => submit(true)}
                                        disabled={form.processing}
                                    >
                                        {form.processing && withFreezer ? (
                                            <Spinner />
                                        ) : (
                                            <Sparkles className="size-5" />
                                        )}
                                        Tout est prêt !
                                    </Button>
                                </div>
                            </div>
                        </StepFrame>
                    )}
                </AnimatePresence>

                {Object.keys(form.errors).length > 0 && step === 2 && (
                    <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-destructive">
                        <Check className="size-4 rotate-45" /> Vérifie les
                        champs en rouge.
                    </p>
                )}
            </main>
        </div>
    );
}

function StepFrame({
    children,
    direction,
}: {
    children: React.ReactNode;
    direction: number;
}) {
    return (
        <motion.div
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0, transitionEnd: { transform: 'none' } }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        >
            {children}
        </motion.div>
    );
}
