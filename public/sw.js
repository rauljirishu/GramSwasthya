const CACHE_NAME = 'gramswasthya-v2';
const OFFLINE_PAGE = '/offline.html';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.add(OFFLINE_PAGE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith('gramswasthya-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Never replace a requested route with a cached dashboard. HTML pages may
  // contain authenticated or role-specific content, so only the neutral
  // offline page is cached.
  event.respondWith(fetch(request).catch(async () => {
    if (request.mode === 'navigate') {
      const cachedOfflinePage = await caches.match(OFFLINE_PAGE);
      return cachedOfflinePage || new Response('GramCare is offline. Reconnect and try again.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    return new Response('', { status: 503, statusText: 'Offline' });
  }));
});
