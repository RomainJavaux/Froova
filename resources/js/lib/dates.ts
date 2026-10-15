import type { Freshness } from '@/types';

const LOCALE = 'fr-FR';

function parse(value: string): Date {
    // Plain dates ("2026-10-15") are local calendar days, not UTC midnights.
    return /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00`)
        : new Date(value);
}

export function todayIso(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;

    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function addMonthsIso(value: string, months: number): string {
    const date = parse(value);
    const day = date.getDate();

    date.setMonth(date.getMonth() + months);

    // Keep "31 jan + 1 month" on the last day of February instead of overflowing.
    if (date.getDate() < day) {
        date.setDate(0);
    }

    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function formatDate(
    value: string | null | undefined,
    options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    },
): string {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat(LOCALE, options).format(parse(value));
}

export function formatDay(value: string): string {
    const date = parse(value);
    const today = parse(todayIso());
    const diff = Math.round(
        (today.getTime() - new Date(date.toDateString()).getTime()) / 86400000,
    );

    if (diff === 0) {
        return 'Aujourd’hui';
    }

    if (diff === 1) {
        return 'Hier';
    }

    const label = new Intl.DateTimeFormat(LOCALE, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        ...(date.getFullYear() !== today.getFullYear()
            ? { year: 'numeric' }
            : {}),
    }).format(date);

    return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatTime(value: string): string {
    return new Intl.DateTimeFormat(LOCALE, {
        hour: '2-digit',
        minute: '2-digit',
    }).format(parse(value));
}

const relative = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });

export function timeAgo(value: string): string {
    const seconds = Math.round((parse(value).getTime() - Date.now()) / 1000);
    const abs = Math.abs(seconds);

    if (abs < 60) {
        return 'à l’instant';
    }

    if (abs < 3600) {
        return relative.format(Math.round(seconds / 60), 'minute');
    }

    if (abs < 86400) {
        return relative.format(Math.round(seconds / 3600), 'hour');
    }

    if (abs < 86400 * 30) {
        return relative.format(Math.round(seconds / 86400), 'day');
    }

    if (abs < 86400 * 365) {
        return relative.format(Math.round(seconds / (86400 * 30)), 'month');
    }

    return relative.format(Math.round(seconds / (86400 * 365)), 'year');
}

/**
 * Human label for the time an item still has, e.g. "Encore 2 mois".
 */
export function freshnessLabel(freshness: Freshness): string {
    const days = freshness.daysLeft;

    if (days === null) {
        return 'Sans date limite';
    }

    if (days < 0) {
        const late = Math.abs(days);

        return late === 1
            ? 'Dépassé d’1 jour'
            : `Dépassé de ${durationLabel(late)}`;
    }

    if (days === 0) {
        return 'À manger aujourd’hui';
    }

    if (days <= 14) {
        return days === 1 ? 'À manger demain' : `À manger sous ${days} j`;
    }

    return `Encore ${durationLabel(days)}`;
}

export function durationLabel(days: number): string {
    if (days < 31) {
        return `${days} jour${days > 1 ? 's' : ''}`;
    }

    const months = Math.round(days / 30.4);

    if (months < 12) {
        return `${months} mois`;
    }

    const years = Math.round((months / 12) * 10) / 10;

    return `${String(years).replace('.', ',')} an${years >= 2 ? 's' : ''}`;
}

export function greeting(): string {
    const hour = new Date().getHours();

    if (hour < 5) {
        return 'Bonne nuit';
    }

    if (hour < 12) {
        return 'Bonjour';
    }

    if (hour < 18) {
        return 'Bon après-midi';
    }

    return 'Bonsoir';
}
