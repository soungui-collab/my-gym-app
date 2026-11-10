const CACHE_NAME = 'gym-app-v2';

// Ensure all paths match your exact GitHub repository structure
const ASSETS_TO_CACHE = [
  '/my-gym-app/',
  '/my-gym-app/index.html',
  '/my-gym-app/app.js',
  '/my-gym-app/privacy.html',
  '/my-gym-app/logo.png',
  '/my-gym-app/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Always bypass cache for live Google Apps Script requests
  if (event.request.url.includes('://google.com')) {
    return;
  }

  // Network-first strategy: tries live GitHub files first, falls back to cache if offline
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => caches.match(event.request))
  );
});
