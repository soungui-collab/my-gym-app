const CACHE_NAME = 'gym-app-v1';
// Ensure all paths include your specific GitHub repository folder name
const ASSETS_TO_CACHE = [
  '/my-gym-app/',
  '/my-gym-app/index.html',
  '/my-gym-app/js/app.js',
  '/my-gym-app/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
