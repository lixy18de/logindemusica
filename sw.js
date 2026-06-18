const CACHE_NAME = 'musicflow-v9';
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
  '/logindemusica/que-te-paso.mp3',
  '/logindemusica/jay-zhamira.mp3',
  '/logindemusica/extranandote.mp3',
  '/logindemusica/de-lejitos.mp3',
  '/logindemusica/ven-porque-te.mp3',
  '/logindemusica/tu-ultima-cancion.mp3',
  '/logindemusica/se-que-te-amo.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// CLAVE: navigate requests siempre devuelven index.html del cache
self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('/logindemusica/index.html').then(cached => {
        return cached || fetch(req);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).catch(() => new Response('', { status: 503 }));
    })
  );
});
