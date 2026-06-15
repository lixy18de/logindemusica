const CACHE_NAME = 'musicflow-v1';
const ASSETS = [
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
  '/logindemusica/icon-512.png',
  '/logindemusica/que-te-paso.aac',
  '/logindemusica/jay-zhamira.aac',
  '/logindemusica/extranandote.aac',
  '/logindemusica/de-lejitos.aac',
  '/logindemusica/ven-porque-te.aac',
  '/logindemusica/tu-ultima-cancion.aac',
  '/logindemusica/enamorado-de-ti.aac',
  '/logindemusica/se-que-te-amo.aac'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
