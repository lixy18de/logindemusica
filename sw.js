const CACHE_NAME = 'musicflow-v5';

// Solo archivos estáticos — SIN canciones
const STATIC = [
  '/logindemusica/',
  '/logindemusica/index.html',
  '/logindemusica/manifest.json',
  '/logindemusica/style.css',
  '/logindemusica/library.js',
  '/logindemusica/player.js',
  '/logindemusica/app.js',
  '/logindemusica/icon-72.png',
  '/logindemusica/icon-96.png',
  '/logindemusica/icon-128.png',
  '/logindemusica/icon-144.png',
  '/logindemusica/icon-152.png',
  '/logindemusica/icon-192.png',
  '/logindemusica/icon-384.png',
  '/logindemusica/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  const isAudio = /\.(aac|mp3|ogg|wav|m4a)(\s.*)?$/i.test(url);

  // Audio: dejar pasar directo, sin cachear (evita error 206)
  if (isAudio) {
    event.respondWith(fetch(event.request).catch(() => new Response('', {status: 503})));
    return;
  }

  // Todo lo demás: cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('/logindemusica/index.html'));
    })
  );
});
