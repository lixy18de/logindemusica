const CACHE_NAME = "musicflow-v2";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",

  "./js/library.js",
  "./js/player.js",
  "./js/app.js",

  "./css/style.css",

  "./icon-72.png",
  "./icon-96.png",
  "./icon-128.png",
  "./icon-144.png",
  "./icon-152.png",
  "./icon-192.png",
  "./icon-384.png",
  "./icon-512.png",

  "./que-te-paso.aac",
  "./jay-zhamira.aac",
  "./extranandote.aac",
  "./de-lejitos.aac",
  "./ven-porque-te.aac",
  "./tu-ultima-cancion.aac",
  "./enamorado-de-ti.aac",
  "./se-que-te-amo.aac"
];

// Instalar
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activar
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then(networkResponse => {

            if (
              !networkResponse ||
              networkResponse.status !== 200
            ) {
              return networkResponse;
            }

            const responseClone = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseClone);
              });

            return networkResponse;
          });
      })
  );
});
