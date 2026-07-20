const CACHE_NAME = 'tic-tac-toe-ai-battle-v2';
const ASSETS = [
  '/tic-tac-toe-ai-battl/',
  '/tic-tac-toe-ai-battl/manifest.json',
  '/tic-tac-toe-ai-battl/icon-192.svg',
  '/tic-tac-toe-ai-battl/icon-512.svg',
  '/tic-tac-toe-ai-battl/preview.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      return response;
    }).catch(() => caches.match('/tic-tac-toe-ai-battl/')))
  );
});
