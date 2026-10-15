import { useSyncExternalStore } from 'react';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

export function registerServiceWorker(): void {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
    }

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredPrompt = event as BeforeInstallPromptEvent;
        notify();
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        notify();
    });

    if (!import.meta.env.PROD) {
        return;
    }

    window.addEventListener('load', () => {
        void navigator.serviceWorker.register('/sw.js', { scope: '/' });
    });
}

export function isStandalone(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

export function isIos(): boolean {
    if (typeof navigator === 'undefined') {
        return false;
    }

    return (
        /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
}

function subscribe(callback: () => void) {
    listeners.add(callback);

    return () => listeners.delete(callback);
}

/**
 * Exposes the browser's "install app" prompt when it is available.
 */
export function useInstallPrompt() {
    const canPrompt = useSyncExternalStore(
        subscribe,
        () => deferredPrompt !== null,
        () => false,
    );

    const install = async (): Promise<boolean> => {
        if (!deferredPrompt) {
            return false;
        }

        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;

        deferredPrompt = null;
        notify();

        return choice.outcome === 'accepted';
    };

    return { canPrompt, install };
}
