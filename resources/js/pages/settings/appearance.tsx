import { Head } from '@inertiajs/react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import Heading from '@/components/heading';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

const OPTIONS: {
    value: Appearance;
    label: string;
    icon: typeof Sun;
    preview: string;
}[] = [
    {
        value: 'light',
        label: 'Clair',
        icon: Sun,
        preview: 'bg-[linear-gradient(160deg,#f8fbff,#e0ecff)]',
    },
    {
        value: 'dark',
        label: 'Sombre',
        icon: Moon,
        preview: 'bg-[linear-gradient(160deg,#1c2442,#0f1428)]',
    },
    {
        value: 'system',
        label: 'Comme mon appareil',
        icon: Monitor,
        preview: 'bg-[linear-gradient(110deg,#f8fbff_50%,#151b33_50%)]',
    },
];

export default function AppearancePage() {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <>
            <Head title="Apparence" />

            <div className="surface space-y-6 p-5 sm:p-6">
                <Heading
                    variant="small"
                    title="Apparence"
                    description="Choisis le thème de l’application sur cet appareil."
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {OPTIONS.map((option) => {
                        const active = appearance === option.value;

                        return (
                            <motion.button
                                key={option.value}
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                onClick={() => updateAppearance(option.value)}
                                className={cn(
                                    'relative overflow-hidden rounded-3xl border p-2 text-left transition',
                                    active
                                        ? 'border-transparent ring-[2.5px] ring-primary'
                                        : 'border-border hover:border-primary/40',
                                )}
                            >
                                <div
                                    className={cn(
                                        'grid h-24 place-items-center rounded-2xl',
                                        option.preview,
                                    )}
                                >
                                    <span className="text-3xl">❄️</span>
                                </div>
                                <div className="flex items-center gap-2 px-2 py-3 text-sm font-semibold">
                                    <option.icon className="size-4" />{' '}
                                    {option.label}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
