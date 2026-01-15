
const CACHE_NAME = 'pdfbhai-v2';
// We precache the core app shell. 
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png'
];

// 1. Install: Cache core assets immediately
self.addEventListener('install', (event) => {
  self.skipWaiting(); // CRITICAL: Forces SW to activate immediately, fixing PWABuilder detection
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// 2. Activate: Clean up old caches and take control of the page
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // CRITICAL: Makes the SW control the page without a reload
});

// 3. Fetch: Stale-While-Revalidate Strategy
// This serves from cache immediately (fast) while updating from network in the background.
self.addEventListener('fetch', (event) => {
  // Skip non-http requests (like extensions)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Create a network fetch promise that updates the cache
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Check if we received a valid response
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failed (offline)
        // If we don't have a cached response either, we just return nothing (or a fallback)
      });

      // Return cached response immediately if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
