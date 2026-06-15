// =============================================
//  MUSICFLOW — Motor del reproductor de audio
// =============================================

const Player = (() => {

  // ---- Estado interno ----
  let audio        = new Audio();
  let queue        = [];
  let queueIndex   = -1;
  let shuffle      = false;
  let repeatMode   = 0;
  let isPlaying    = false;
  let seekDragging = false;

  // ---- Elementos del DOM ----
  const DOM = {};

  function initDOM() {
    DOM.fpPlayBtn      = document.getElementById("fp-play-btn");
    DOM.fpPlayIcon     = document.getElementById("fp-play-icon");
    DOM.fpPrevBtn      = document.getElementById("fp-prev-btn");
    DOM.fpNextBtn      = document.getElementById("fp-next-btn");
    DOM.fpShuffleBtn   = document.getElementById("fp-shuffle-btn");
    DOM.fpRepeatBtn    = document.getElementById("fp-repeat-btn");
    DOM.fpFavBtn       = document.getElementById("fp-fav-btn");
    DOM.fpFavIcon      = document.getElementById("fp-fav-icon");
    DOM.fpTitle        = document.getElementById("fp-title");
    DOM.fpArtist       = document.getElementById("fp-artist");
    DOM.fpCoverEmoji   = document.getElementById("fp-cover-emoji");
    DOM.fpCoverImg     = document.getElementById("fp-cover-img");
    DOM.fpCover        = document.getElementById("fp-cover");
    DOM.fpPlaylistName = document.getElementById("fp-playlist-name");
    DOM.fpSeekbarFill  = document.getElementById("fp-seekbar-fill");
    DOM.fpSeekbarThumb = document.getElementById("fp-seekbar-thumb");
    DOM.fpSeekContainer= document.querySelector(".fp-seekbar-container");
    DOM.fpSeekbar      = document.getElementById("fp-seekbar");
    DOM.fpTimeCurrent  = document.getElementById("fp-time-current");
    DOM.fpTimeTotal    = document.getElementById("fp-time-total");
    DOM.fpClose        = document.getElementById("fp-close");
    DOM.fullPlayer     = document.getElementById("full-player");
    DOM.mpPlayBtn      = document.getElementById("mp-play-btn");
    DOM.mpPlayIcon     = document.getElementById("mp-play-icon");
    DOM.mpNextBtn      = document.getElementById("mp-next-btn");
    DOM.mpTitle        = document.getElementById("mp-title");
    DOM.mpArtist       = document.getElementById("mp-artist");
    DOM.mpEmoji        = document.getElementById("mp-emoji");
    DOM.mpProgress     = document.getElementById("mp-progress");
    DOM.miniPlayer     = document.getElementById("mini-player");
    DOM.volumeSlider   = document.getElementById("volume-slider");
  }

  // ---- Audio events ----
  function bindAudioEvents() {
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended",      onEnded);
    audio.addEventListener("loadedmetadata", onMetadata);
    audio.addEventListener("play",  () => setPlayState(true));
    audio.addEventListener("pause", () => setPlayState(false));
    audio.addEventListener("error", onError);
  }

  function onTimeUpdate() {
    if (!audio.duration || seekDragging) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    DOM.fpSeekbarFill.style.width  = pct + "%";
    DOM.fpSeekbarThumb.style.left  = pct + "%";
    DOM.mpProgress.style.width     = pct + "%";
    DOM.fpTimeCurrent.textContent  = formatTime(audio.currentTime);
  }

  function onMetadata() {
    DOM.fpTimeTotal.textContent = formatTime(audio.duration);
  }

  function onEnded() {
    if (repeatMode === 2) {
      audio.currentTime = 0;
      audio.play();
      return;
    }
    if (queueIndex < queue.length - 1) {
      next();
    } else if (repeatMode === 1) {
      queueIndex = -1;
      next();
    } else {
      setPlayState(false);
    }
  }

  // ── CORREGIDO: sin loop automático ──
  function onError() {
    console.warn("Error cargando audio:", audio.src);
    setPlayState(false);
  }

  // ---- Bind controles UI ----
  function bindControls() {
    DOM.fpPlayBtn.addEventListener("click",    togglePlay);
    DOM.mpPlayBtn.addEventListener("click",    togglePlay);
    DOM.fpPrevBtn.addEventListener("click",    prev);
    DOM.fpNextBtn.addEventListener("click",    next);
    DOM.mpNextBtn.addEventListener("click",    next);
    DOM.fpShuffleBtn.addEventListener("click", toggleShuffle);
    DOM.fpRepeatBtn.addEventListener("click",  cycleRepeat);
    DOM.fpFavBtn.addEventListener("click",     toggleCurrentFav);
    DOM.fpClose.addEventListener("click",      closeFullPlayer);
    DOM.volumeSlider.addEventListener("input", e => {
      audio.volume = parseFloat(e.target.value);
    });

    // Seekbar
    DOM.fpSeekContainer.addEventListener("click",     onSeekClick);
    DOM.fpSeekContainer.addEventListener("mousedown", onSeekStart);
    DOM.fpSeekContainer.addEventListener("touchstart", onSeekStart, { passive: true });
    window.addEventListener("mousemove",  onSeekMove);
    window.addEventListener("touchmove",  onSeekMove, { passive: false });
    window.addEventListener("mouseup",    onSeekEnd);
    window.addEventListener("touchend",   onSeekEnd);

    // Mini player → abrir full player
    DOM.miniPlayer.addEventListener("click", openFullPlayer);

    // Swipe hacia abajo para cerrar
    let touchStartY = 0;
    DOM.fullPlayer.addEventListener("touchstart", e => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    DOM.fullPlayer.addEventListener("touchend", e => {
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (dy > 80) closeFullPlayer();
    }, { passive: true });
  }

  // ---- Seekbar helpers ----
  function getSeekPct(e) {
    const rect = DOM.fpSeekbar.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }

  function onSeekClick(e) {
    if (!audio.duration) return;
    const pct = getSeekPct(e);
    audio.currentTime = pct * audio.duration;
  }

  function onSeekStart(e) {
    if (!audio.duration) return;
    seekDragging = true;
  }

  function onSeekMove(e) {
    if (!seekDragging || !audio.duration) return;
    if (e.cancelable) e.preventDefault();
    const pct = getSeekPct(e) * 100;
    DOM.fpSeekbarFill.style.width = pct + "%";
    DOM.fpSeekbarThumb.style.left = pct + "%";
    DOM.fpTimeCurrent.textContent = formatTime((pct / 100) * audio.duration);
  }

  function onSeekEnd(e) {
    if (!seekDragging || !audio.duration) return;
    seekDragging = false;
    const pct = getSeekPct(e.changedTouches ? e.changedTouches[0] : e);
    audio.currentTime = pct * audio.duration;
  }

  // ---- Reproducción ----
  function loadSong(song, autoplay = true) {
    if (!song) return;

    // Detener audio anterior limpiamente
    audio.pause();
    audio.src = "";
    audio.load();

    // Asignar nueva fuente
    audio.src = song.src;
    audio.load();

    // Actualizar UI full player
    DOM.fpTitle.textContent       = song.title;
    DOM.fpArtist.textContent      = song.artist;
    DOM.fpTimeCurrent.textContent = "0:00";
    DOM.fpTimeTotal.textContent   = formatTime(song.duration || 0);
    DOM.fpSeekbarFill.style.width = "0%";
    DOM.fpSeekbarThumb.style.left = "0%";
    DOM.mpProgress.style.width    = "0%";

    // Cover
    if (song.cover) {
      DOM.fpCoverImg.src             = song.cover;
      DOM.fpCoverImg.style.display   = "block";
      DOM.fpCoverEmoji.style.display = "none";
    } else {
      DOM.fpCoverImg.style.display   = "none";
      DOM.fpCoverEmoji.style.display = "block";
      DOM.fpCoverEmoji.textContent   = song.emoji || "🎵";
    }

    // Mini player
    DOM.mpTitle.textContent      = song.title;
    DOM.mpArtist.textContent     = song.artist;
    DOM.mpEmoji.textContent      = song.emoji || "🎵";
    DOM.miniPlayer.style.display = "flex";

    // Favorito
    updateFavBtn(isFavorite(song.id));

    // Notificar a app.js
    if (typeof onSongChanged === "function") onSongChanged(song);

    if (autoplay) {
      audio.play().catch(err => console.warn("Autoplay bloqueado:", err));
    }
  }

  function play(songId, songQueue, queuePos) {
    queue      = songQueue || getAllSongs();
    queueIndex = (queuePos !== undefined) ? queuePos
                  : queue.findIndex(s => s.id === songId);
    if (queueIndex === -1) queueIndex = 0;
    loadSong(queue[queueIndex]);
  }

  function togglePlay() {
    if (!audio.src) return;
    if (audio.paused) {
      audio.play().catch(console.warn);
    } else {
      audio.pause();
    }
  }

  function prev() {
    if (!queue.length) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (shuffle) {
      queueIndex = randomIndex();
    } else {
      queueIndex = (queueIndex - 1 + queue.length) % queue.length;
    }
    loadSong(queue[queueIndex]);
  }

  function next() {
    if (!queue.length) return;
    if (shuffle) {
      queueIndex = randomIndex();
    } else {
      queueIndex = (queueIndex + 1) % queue.length;
    }
    loadSong(queue[queueIndex]);
  }

  function randomIndex() {
    let idx;
    do { idx = Math.floor(Math.random() * queue.length); }
    while (idx === queueIndex && queue.length > 1);
    return idx;
  }

  // ---- Shuffle ----
  function toggleShuffle() {
    shuffle = !shuffle;
    DOM.fpShuffleBtn.classList.toggle("active", shuffle);
  }

  // ---- Repeat ----
  function cycleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    const icons = [
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>`,
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>`,
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        <text x="10" y="14" font-size="7" fill="currentColor" stroke="none" font-weight="700">1</text>
      </svg>`
    ];
    DOM.fpRepeatBtn.innerHTML = icons[repeatMode];
    DOM.fpRepeatBtn.classList.toggle("active", repeatMode > 0);
  }

  // ---- Favoritos ----
  function toggleCurrentFav() {
    const song = currentSong();
    if (!song) return;
    const isNowFav = toggleFavorite(song.id);
    updateFavBtn(isNowFav);
    if (typeof onFavChanged === "function") onFavChanged(song.id, isNowFav);
  }

  function updateFavBtn(active) {
    DOM.fpFavBtn.classList.toggle("active", active);
    DOM.fpFavIcon.setAttribute("fill", active ? "currentColor" : "none");
  }

  // ---- Play state UI ----
  function setPlayState(playing) {
    isPlaying = playing;
    DOM.fpCover.classList.toggle("playing", playing);

    const pauseIcon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
    </svg>`;
    const playIcon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21"/>
    </svg>`;
    const pauseIconSm = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
    </svg>`;
    const playIconSm = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21"/>
    </svg>`;

    DOM.fpPlayBtn.innerHTML = playing ? pauseIcon   : playIcon;
    DOM.mpPlayBtn.innerHTML = playing ? pauseIconSm : playIconSm;

    if (typeof onPlayStateChanged === "function") onPlayStateChanged(playing);
  }

  // ---- Full player ----
  function openFullPlayer() {
    DOM.fullPlayer.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeFullPlayer() {
    DOM.fullPlayer.classList.remove("open");
    document.body.style.overflow = "";
  }

  // ---- Helpers ----
  function formatTime(s) {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  function currentSong() {
    return queue[queueIndex] || null;
  }

  function currentId() {
    const s = currentSong();
    return s ? s.id : null;
  }

  function isCurrentlyPlaying() {
    return isPlaying;
  }

  // ---- Init ----
  function init() {
    initDOM();
    bindAudioEvents();
    bindControls();
  }

  return {
    init,
    play,
    togglePlay,
    next,
    prev,
    openFullPlayer,
    closeFullPlayer,
    currentId,
    currentSong,
    isCurrentlyPlaying,
    updateFavBtn
  };

})();
