// Offline copy for spotty ranch and mountain coverage. Network first with a 3 s limit, then the cache.
// Only good (200) answers are cached; old caches are removed on update.
const C = 'ranch-guide-v2';
const FILES = ['index.html', 'style.css', 'app.js', 'data/content.js', 'data/towns.json', 'img/logo.png', 'manifest.json'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(C).then((c) => c.addAll(FILES))));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k))))));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const net = fetch(e.request).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(C).then((c) => c.put(e.request, copy)); } return r; });
  const slow = new Promise((res) => setTimeout(() => caches.match(e.request).then((m) => m && res(m)), 3000));
  e.respondWith(Promise.race([net.catch(() => caches.match(e.request)), slow]));
});
