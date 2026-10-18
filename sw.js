const CACHE_NAME = 'gym-app-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/js/app.js',
  '/manifest.json'
];

// 1. Install Event: Save core files into the local phone cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Gym App: Caching offline core assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Activate Event: Clean up old caches if you update the app layout later
self.addEventListener('activate', (event) => {
  console.log('Gym App: Service Worker Activated');
});

// 3. Fetch Event: Serve cached files instantly instead of waiting for the network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached file if found, otherwise download it normally
      return cachedResponse || fetch(event.request);
    })
  );
});
