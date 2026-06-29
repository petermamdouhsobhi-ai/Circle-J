/* Circle J — auto-update service worker (network-first)
   بيخلّي التطبيق يجيب آخر نسخة طول ما فيه نت، ويشتغل أوفلاين من آخر نسخة محفوظة */
const CACHE = 'circlej-v1';

self.addEventListener('install', (e) => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isHTML = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');
  e.respondWith((async () => {
    try {
      // network-first: للصفحة نتجاهل الكاش عشان نجيب آخر نسخة
      const fresh = await fetch(isHTML ? new Request(req.url, { cache: 'no-store' }) : req);
      const cache = await caches.open(CACHE);
      try { cache.put(req, fresh.clone()); } catch (_) {}
      return fresh;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (isHTML) {
        const home = await caches.match('./') || await caches.match('index.html');
        if (home) return home;
      }
      throw err;
    }
  })());
});
