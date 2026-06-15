const CACHE_NAME = "musicflow-v4";
const AUDIO_CACHE = "musicflow-audio-v4";

// Archivos estáticos — se cachean al instalar
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
  "./icon-512.png"
];

// Canciones — se cachean cuando se reproducen por primera vez
const AUDIO_FILES = [
  "./que-te-paso.aac",
  "./jay-zhamira.aac",
  "./extranandote.aac",
  "./de-lejitos.aac",
  "./ven-porque-te.aac",
  "./tu-ultima-cancion.aac",
  "./enamorado-de-ti.aac",
  "./se-que-te-amo.aac"
];

// ── INSTALAR ──
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => {
        // Intentar cachear audios en segundo plano (sin bloquear)
        caches.open(AUDIO_CACHE).then(cache => {
          AUDIO_FILES.forEach(url => {
            fetch(url).then(res => {
              if (res.ok) cache.put(url, res);
            }).catch(() => {});
          });
        });
      })
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVAR ──
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== AUDIO_CACHE)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ──
self.addEventListener("fetch", event => {
  const url = event.request.url;
  const isAudio = /\.(aac|mp3|ogg|wav|flac|m4a)$/i.test(url);

  if (isAudio) {
    // Para audio: cache primero, si no hay va a red y lo guarda
    event.respondWith(
      caches.open(AUDIO_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response && response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(() => cached || new Response('', { status: 503 }));
        })
      )
    );
    return;
  }

  // Para todo lo demás: cache primero, luego red
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
