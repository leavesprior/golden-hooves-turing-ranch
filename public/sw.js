// BOBR service worker (2026-06-18) — conservative, security-first.
// RULES:
//  - NEVER cache /api/* (the server-authoritative discount/marker/karma/booking
//    paths must always hit the network — no stale money responses, ever).
//  - Pages: network-first with an offline fallback (never serve a stale page over a fresh one).
//  - Static assets: cache-first + background revalidate (fast repeat loads).
// Kill-switch: deploy a sw.js whose body is just self.skipWaiting()+clients.claim()
// and an empty fetch handler to unregister behaviour if it ever misbehaves.
const VERSION = 'bobr-v1-20260823-arcade';
const CACHE = `bobr-static-${VERSION}`;
const PRECACHE = ['/', '/offline'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // cross-origin: do not intercept
  if (url.pathname.startsWith('/api/')) return;        // server-authoritative: network only, never cache

  if (req.mode === 'navigate') {                       // pages: network-first, offline fallback
    event.respondWith(
      fetch(req).catch(() => caches.match(req).then((r) => r || caches.match('/offline')))
    );
    return;
  }

  // static assets: cache-first, revalidate in the background
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
