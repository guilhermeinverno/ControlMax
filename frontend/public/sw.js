const CACHE_NAME = 'controlmax-cache-v3'; // Bumped cache version
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Add a cache buster query string to ensure we get the latest files from the network
      const cacheBustedRequests = ASSETS_TO_CACHE.map(url => new Request(`${url}?_cb=${Date.now()}`, { cache: 'reload' }));
      return cache.addAll(cacheBustedRequests);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests and exclude Firestore/Firebase calls or API endpoints
  if (event.request.method !== 'GET' || event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('/api/')) {
    return;
  }

  const url = new URL(event.request.url);
  
  // Navigation requests (HTML pages) should always be network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Network first for JS/CSS assets to always get the latest deployment
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request, { ignoreSearch: true });
      })
    );
    return;
  }

  // Cache first for other assets (images, icons)
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
