// =============================================
//  MUSICFLOW — Navegación, UI y arranque
// =============================================

// Callbacks que player.js llama cuando algo cambia
function onSongChanged(song) {
  highlightActiveSong(song.id);
  updateFavButtons(song.id);
}

function onPlayStateChanged(playing) {
  highlightPlayState(playing);
}

function onFavChanged(songId, isNow) {
  updateFavButtons(songId);
  renderFavorites();
}

// =============================================
//  NAVEGACIÓN ENTRE PANTALLAS
// =============================================

let currentScreen = "home";

function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));

  const screen = document.getElementById("screen-" + name);
  const navBtn  = document.querySelector(`.nav-item[data-screen="${name}"]`);

  if (screen) screen.classList.add("active");
  if (navBtn)  navBtn.classList.add("active");

  currentScreen = name;

  // Renderizar contenido según pantalla
  if (name === "favorites") renderFavorites();
  if (name === "library")   renderPlaylists();
  if (name === "search")    document.getElementById("search-input").focus();
}

// Botones nav
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => showScreen(btn.dataset.screen));
});

// =============================================
//  RENDER — LISTA DE CANCIONES
// =============================================

function createSongItem(song, queue, index) {
  const isActive = Player.currentId() === song.id;
  const isFav    = isFavorite(song.id);
  const isPlay   = isActive && Player.isCurrentlyPlaying();

  const item = document.createElement("div");
  item.className = "song-item" + (isActive ? " playing" : "");
  item.dataset.id = song.id;

  // Delay de animación escalonado
  item.style.animationDelay = (index * 0.04) + "s";

  const coverHTML = song.cover
    ? `<img src="${song.cover}" alt="${song.title}" loading="lazy">`
    : `<span>${song.emoji || "🎵"}</span>`;

  const eqHTML = isActive
    ? `<div class="equalizer${isPlay ? "" : " paused"}">
        <span></span><span></span><span></span>
      </div>`
    : `<span class="song-duration">${formatDuration(song.duration)}</span>`;

  item.innerHTML = `
    <div class="song-cover">${coverHTML}</div>
    <div class="song-info">
      <div class="song-name">${escHtml(song.title)}</div>
      <div class="song-meta">${escHtml(song.artist)} · ${escHtml(song.album)}</div>
    </div>
    <div class="song-right">
      ${eqHTML}
      <button class="song-fav-btn${isFav ? " active" : ""}"
              data-id="${song.id}" aria-label="Favorito">
        <svg width="18" height="18" viewBox="0 0 24 24"
             fill="${isFav ? "currentColor" : "none"}"
             stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67
                   l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78
                   l1.06 1.06L12 21.23l7.78-7.78
                   1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
    </div>
  `;

  // Click en la canción → reproducir
  item.addEventListener("click", e => {
    if (e.target.closest(".song-fav-btn")) return;
    Player.play(song.id, queue, index);
    Player.openFullPlayer();
  });

  // Click en favorito
  item.querySelector(".song-fav-btn").addEventListener("click", e => {
    e.stopPropagation();
    const nowFav = toggleFavorite(song.id);
    updateFavButtons(song.id);
    if (currentScreen === "favorites") renderFavorites();
  });

  return item;
}

function renderSongList(containerId, songs) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  if (!songs.length) return;
  const frag = document.createDocumentFragment();
  songs.forEach((song, i) => frag.appendChild(createSongItem(song, songs, i)));
  container.appendChild(frag);
}

// =============================================
//  RENDER — INICIO
// =============================================

function renderHome() {
  const songs = getAllSongs();
  renderSongList("home-list", songs);
}

// =============================================
//  RENDER — BÚSQUEDA
// =============================================

const searchInput = document.getElementById("search-input");
const searchEmpty = document.getElementById("search-empty");

searchInput.addEventListener("input", () => {
  const q       = searchInput.value.trim();
  const results = searchSongs(q);

  if (!q) {
    renderSongList("search-list", []);
    searchEmpty.style.display = "flex";
    return;
  }

  searchEmpty.style.display = "none";
  renderSongList("search-list", results);

  if (!results.length) {
    searchEmpty.style.display = "flex";
    searchEmpty.querySelector("p").textContent = `Sin resultados para "${q}"`;
    searchEmpty.querySelector(".empty-icon").textContent = "🎧";
  }
});

// Mostrar empty state al inicio de búsqueda
searchEmpty.style.display = "flex";

// =============================================
//  RENDER — LISTAS DE REPRODUCCIÓN
// =============================================

function renderPlaylists() {
  const grid = document.getElementById("playlist-grid");
  const detail = document.getElementById("playlist-detail");
  const backBtn = document.getElementById("pl-back-btn");
  const title   = document.getElementById("library-title");

  grid.style.display   = "grid";
  detail.style.display = "none";
  backBtn.style.display = "none";
  title.textContent    = "Mis Listas";

  grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  PLAYLISTS.forEach(pl => {
    const songs = getSongsByPlaylist(pl.id);
    const card  = document.createElement("div");
    card.className = "playlist-card";
    card.innerHTML = `
      <span class="playlist-cover">${pl.emoji}</span>
      <div class="playlist-name">${escHtml(pl.name)}</div>
      <div class="playlist-count">${songs.length} canciones</div>
    `;
    card.addEventListener("click", () => openPlaylist(pl, songs));
    frag.appendChild(card);
  });

  grid.appendChild(frag);
}

function openPlaylist(pl, songs) {
  const grid    = document.getElementById("playlist-grid");
  const detail  = document.getElementById("playlist-detail");
  const backBtn = document.getElementById("pl-back-btn");
  const title   = document.getElementById("library-title");

  grid.style.display   = "none";
  detail.style.display = "block";
  backBtn.style.display = "flex";
  title.textContent    = `${pl.emoji} ${pl.name}`;

  renderSongList("playlist-songs", songs);
}

function backToPlaylists() {
  renderPlaylists();
}

// =============================================
//  RENDER — FAVORITOS
// =============================================

function renderFavorites() {
  const songs    = getFavoriteSongs();
  const favEmpty = document.getElementById("fav-empty");

  if (!songs.length) {
    document.getElementById("fav-list").innerHTML = "";
    favEmpty.style.display = "flex";
  } else {
    favEmpty.style.display = "none";
    renderSongList("fav-list", songs);
  }
}

// =============================================
//  ACTUALIZAR UI — canción activa y favoritos
// =============================================

function highlightActiveSong(songId) {
  // Quitar clase playing de todos
  document.querySelectorAll(".song-item").forEach(el => {
    el.classList.remove("playing");
    const eq = el.querySelector(".equalizer");
    if (eq) {
      // Reemplazar equalizer por duración
      const id  = parseInt(el.dataset.id);
      const song = getSongById(id);
      if (song) {
        eq.outerHTML = `<span class="song-duration">${formatDuration(song.duration)}</span>`;
      }
    }
    // Color del nombre
    el.querySelector(".song-name")?.style.removeProperty("color");
  });

  // Marcar el activo
  document.querySelectorAll(`.song-item[data-id="${songId}"]`).forEach(el => {
    el.classList.add("playing");
    el.querySelector(".song-name")?.style.setProperty("color", "var(--green)");
    const durSpan = el.querySelector(".song-duration");
    if (durSpan) {
      durSpan.outerHTML = `<div class="equalizer">
        <span></span><span></span><span></span>
      </div>`;
    }
  });
}

function highlightPlayState(playing) {
  document.querySelectorAll(".equalizer").forEach(eq => {
    eq.classList.toggle("paused", !playing);
  });
}

function updateFavButtons(songId) {
  const isNowFav = isFavorite(songId);
  document.querySelectorAll(`.song-fav-btn[data-id="${songId}"]`).forEach(btn => {
    btn.classList.toggle("active", isNowFav);
    const svg = btn.querySelector("svg");
    if (svg) svg.setAttribute("fill", isNowFav ? "currentColor" : "none");
  });
  // Si es la canción actual también actualizar el botón del full player
  if (Player.currentId() === songId) {
    Player.updateFavBtn(isNowFav);
  }
}

// =============================================
//  SHUFFLE DESDE INICIO
// =============================================

document.getElementById("shuffle-all-btn").addEventListener("click", () => {
  const songs = getAllSongs();
  if (!songs.length) return;
  const randomIdx = Math.floor(Math.random() * songs.length);
  Player.play(songs[randomIdx].id, songs, randomIdx);
  Player.openFullPlayer();
});

// =============================================
//  HELPERS
// =============================================

function formatDuration(seconds) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function escHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// =============================================
//  REGISTRO DEL SERVICE WORKER
// =============================================

function registerSW() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js")
        .then(reg => console.log("SW registrado:", reg.scope))
        .catch(err => console.warn("SW error:", err));
    });
  }
}

// =============================================
//  ARRANQUE
// =============================================

document.addEventListener("DOMContentLoaded", () => {
  Player.init();
  renderHome();
  showScreen("home");
  registerSW();
  console.log("%cMusicFlow cargado 🎵", "color:#1db954;font-weight:bold;font-size:14px");
});