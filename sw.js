// ==============================================================================
// SATIR PWA - SERVICE WORKER (v3.0.0 - FIREBASE SYNC READY)
// ==============================================================================
const CACHE_VERSION = 'satir-v3.0.0';
const SHELL_CACHE = `shell-${CACHE_VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './firebase-config.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      for (const asset of CORE_ASSETS) {
        try { await cache.add(asset); } catch (e) {}
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== SHELL_CACHE ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  // Firebase Auth & Firestore gerçek zamanlı bağlantılarını önbelleğe alma
  if (
    url.origin.includes('firestore.googleapis.com') ||
    url.origin.includes('identitytoolkit.googleapis.com') ||
    url.origin.includes('securetoken.googleapis.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(event.request, clone));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(event.request, { ignoreSearch: true });
        if (cached) return cached;
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
        return new Response('', { status: 404 });
      })
  );
});