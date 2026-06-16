const CACHE_NAME = 'musicflow-v7';
const ASSETS = [
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
      // Cachear uno por uno para que un error no rompa todo
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(e => console.warn('No se pudo cachear:', url, e)))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Ignorar favicon y requests que no sean http
  if (!event.request.url.startsWith('http')) return;
  if (event.request.url.includes('favicon.ico')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        return caches.match('/logindemusica/index.html');
      });
    })
  );
});
