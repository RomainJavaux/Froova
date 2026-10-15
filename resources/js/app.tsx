import { createInertiaApp, router } from '@inertiajs/react';
import { MotionConfig } from 'motion/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { celebrate } from '@/lib/celebrate';
import { registerServiceWorker } from '@/lib/pwa';

const appName = import.meta.env.VITE_APP_NAME || 'Froova';

/**
 * Pages that draw their own full-screen layout.
 */
const STANDALONE_PAGES = ['welcome', 'onboarding', 'invitations/show'];

void createInertiaApp({
    title: (title) => (title ? `${title} · ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case STANDALONE_PAGES.includes(name):
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <MotionConfig reducedMotion="user">
                <TooltipProvider delayDuration={0}>
                    {app}
                    <Toaster />
                </TooltipProvider>
            </MotionConfig>
        );
    },
    progress: {
        color: '#6366f1',
        delay: 120,
    },
});

router.on('flash', (event) => {
    if (event.detail.flash.celebrate) {
        window.setTimeout(() => celebrate(), 350);
    }
});

// This will set light / dark mode on load...
initializeTheme();

registerServiceWorker();
