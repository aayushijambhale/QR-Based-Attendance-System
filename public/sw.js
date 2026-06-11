const CACHE_NAME = 'apex-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).catch(err => {
      console.warn('SW cache pre-fill skipped during dev:', err);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  // Simple network-first fallback to cache strategy to bypass API and websocket calls
  if (e.request.url.includes('/api/') || e.request.url.includes('socket.io')) {
    return; // Let server requests pass through directly
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // If response is valid, clone and update cache
        if (res.status === 200 && e.request.method === 'GET') {
          const cacheCopy = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, cacheCopy);
          });
        }
        return res;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});
