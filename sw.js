const CACHE_NAME = "musicflow-v3";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./style.css",
  "./library.js",
  "./player.js",
  "./app.js",
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

// Instalar y cachear todo
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activar y limpiar caches viejos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — primero cache, luego red
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // Sin internet y sin cache — devolver página principal
        return caches.match("./index.html");
      });
    })
  );
});
