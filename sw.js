// ==============================================================================
// SATIR PWA - SERVICE WORKER
// ==============================================================================
const CACHE_VERSION = 'satir-v1.0.0';
const SHELL_CACHE = `shell-${CACHE_VERSION}`;
const DATA_CACHE = `data-${CACHE_VERSION}`;

// Uygulama kabuğunu oluşturan yerel statik kaynaklar
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './firebase-config.js',
  './css/main.css',
  './css/themes.css',
  './css/components.css',
  './icons/favicon.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/icon.svg',
  './js/app.js',
  './js/i18n.js',
  './js/db.js',
  './js/store.js',
  './js/timer.js',
  './js/streak.js',
  './js/stats.js',
  './js/search.js',
  './js/scan.js',
  './js/ocr.js',
  './js/share.js',
  './js/sound.js',
  './js/badges.js',
  './js/backup.js',
  './js/sample-data.js',
  './js/auth.js',
  './js/sync.js',
  './js/ui/router.js',
  './js/ui/components.js',
  './js/ui/today-view.js',
  './js/ui/library-view.js',
  './js/ui/book-detail-view.js',
  './js/ui/add-book-modal.js',
  './js/ui/timer-view.js',
  './js/ui/quotes-view.js',
  './js/ui/stats-view.js',
  './js/ui/calendar-view.js',
  './js/ui/settings-view.js',
  './js/ui/account-modal.js',
  './js/ui/onboarding-modal.js'
];

// Sabit sürümlü CDN kütüphaneleri (çevrimdışı çalışabilirlik için önbelleğe alınır)
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      // Yerel statik varlıkları önbelleğe al
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn(`[SW] Statik asset önbelleğe alınamadı (${asset}):`, err);
        }
      }
      // Sabit CDN varlıklarını önbelleğe al (varsa ağdan çeker, yoksa pas geçer)
      for (const cdnUrl of CDN_ASSETS) {
        try {
          const req = new Request(cdnUrl, { mode: 'cors' });
          const res = await fetch(req);
          if (res.ok) {
            await cache.put(req, res);
          }
        } catch (cdnErr) {
          console.warn(`[SW] CDN varlığı önbelleğe alınamadı (${cdnUrl}):`, cdnErr);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== SHELL_CACHE && key !== DATA_CACHE) {
            console.log(`[SW] Eski önbellek siliniyor: ${key}`);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Sadece GET istekleri önbelleğe alınır
  if (event.request.method !== 'GET') {
    return;
  }

  // Firebase Firestore / Auth websocket veya streaming istekleri cache'lenmez
  if (url.origin.includes('firestore.googleapis.com') ||
      url.origin.includes('identitytoolkit.googleapis.com') ||
      url.origin.includes('securetoken.googleapis.com')) {
    return;
  }

  // Harici Kitap Arama API'leri (Open Library, Google Books) -> Stale-While-Revalidate
  if (url.origin.includes('openlibrary.org') || url.origin.includes('googleapis.com')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (fetchErr) {
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          throw fetchErr;
        }
      }).catch(() => {
        return new Response(JSON.stringify({ error: 'Ağ bağlantısı yok (Çevrimdışı)' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Yerel Kabuk & CDN Varlıkları -> Cache-First, sonra Network
  event.respondWith(
    caches.match(event.request, { ignoreSearch: false }).then(async (cached) => {
      if (cached) {
        // Arka planda güncelleme dene (Stale-While-Revalidate mantığı)
        fetch(event.request).then((fresh) => {
          if (fresh && fresh.status === 200) {
            caches.open(SHELL_CACHE).then((c) => c.put(event.request, fresh));
          }
        }).catch(() => {/* sessiz çevrimdışı */});
        return cached;
      }

      // Önbellekte yoksa ağdan al ve kabuğa ekle
      try {
        const response = await fetch(event.request);
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(event.request, responseClone));
        }
        return response;
      } catch (err) {
        // Eğer HTML isteğiyse index.html döndür (SPA fallback)
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
        throw err;
      }
    })
  );
});
