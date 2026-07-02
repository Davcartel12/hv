// ── KO SPA Service Worker ──
// Caches the shell + view fragments. Network-first for views/HTML so updates
// appear immediately; cache-first for static assets (images, fonts).

const CACHE = 'ko-spa-v1';
const CORE = [
  './',
  './index.html',
  './view-index.html',
  './view-income.html',
  './view-account.html',
  './view-deposit.html',
  './view-support.html',
  './view-chat.html',
  './manifest.json',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {}))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never cache Firebase / Google / API traffic — always go to network.
  if (/gstatic\.com|googleapis\.com|firebaseio\.com|firebase|identitytoolkit|recaptcha|google\.com/.test(url.host)) {
    return; // default browser fetch
  }

  const isHTMLish =
    req.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/');

  if (isHTMLish) {
    // Network-first: fresh content, fall back to cache offline.
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((r) => r || caches.match('./index.html'))
        )
    );
    return;
  }

  // Static assets: cache-first.
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => cached);
    })
  );
});
