/*
 * Froova service worker.
 *
 * - Hashed build assets (JS, CSS, fonts): cache first, they never change.
 * - Photos and icons: served from cache, refreshed in the background.
 * - Pages: network first, falling back to the last version seen, then to /offline.html.
 * - Inertia requests and anything that is not a GET always go to the network.
 */
const VERSION = 'froova-v1';
const STATIC_CACHE = `${VERSION}-static`;
const IMAGE_CACHE = `${VERSION}-images`;
const PAGE_CACHE = `${VERSION}-pages`;
const OFFLINE_URL = '/offline.html';
const PRECACHE = [
    OFFLINE_URL,
    '/favicon.svg',
    '/icons/icon-192.png',
    '/manifest.webmanifest',
];
const MAX_IMAGES = 150;
const MAX_PAGES = 40;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter((key) => !key.startsWith(VERSION))
                    .map((key) => caches.delete(key)),
            );

            if (self.registration.navigationPreload) {
                await self.registration.navigationPreload.enable();
            }

            await self.clients.claim();
        })(),
    );
});

self.addEventListener('message', (event) => {
    // Signing out must not leave the household's pages readable offline.
    if (event.data?.type === 'logout') {
        event.waitUntil(caches.delete(PAGE_CACHE));
    }
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }

    if (
        request.headers.has('X-Inertia') ||
        url.pathname.startsWith('/_inertia') ||
        url.pathname === '/sw.js'
    ) {
        return;
    }

    if (url.pathname.startsWith('/build/')) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));

        return;
    }

    if (
        url.pathname.startsWith('/storage/') ||
        url.pathname.startsWith('/icons/')
    ) {
        event.respondWith(
            staleWhileRevalidate(request, IMAGE_CACHE, MAX_IMAGES),
        );

        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(networkFirstPage(event));
    }
});

async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);

    if (cached) {
        return cached;
    }

    const response = await fetch(request);

    if (response.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
    }

    return response;
}

async function staleWhileRevalidate(request, cacheName, limit) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const network = fetch(request)
        .then(async (response) => {
            if (response.ok) {
                await cache.put(request, response.clone());
                await trim(cacheName, limit);
            }

            return response;
        })
        .catch(() => cached);

    return cached ?? network;
}

async function networkFirstPage(event) {
    const { request } = event;

    try {
        const response =
            (await event.preloadResponse) ?? (await fetch(request));

        // Only keep real pages (not redirects to the login screen) for offline use.
        if (response.ok && !response.redirected) {
            const cache = await caches.open(PAGE_CACHE);
            await cache.put(request, response.clone());
            await trim(PAGE_CACHE, MAX_PAGES);
        }

        return response;
    } catch {
        const cached = await caches.match(request, { ignoreSearch: true });

        return cached ?? (await caches.match(OFFLINE_URL));
    }
}

async function trim(cacheName, limit) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    await Promise.all(
        keys
            .slice(0, Math.max(0, keys.length - limit))
            .map((key) => cache.delete(key)),
    );
}
