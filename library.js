const LIBRARY = [
  {
    id: 1,
    title: "¿Qué Te Pasó?",
    artist: "Greeicy, Jay Wheeler",
    album: "Single",
    src: "que-te-paso.mp3",
    emoji: "💚",
    cover: null,
    duration: 165,
    playlists: ["all", "jay-wheeler"]
  },
  {
    id: 2,
    title: "Jay & Zhamira",
    artist: "Jay Wheeler & Zhamira Zambrano",
    album: "Single",
    src: "jay-zhamira.mp3",
    emoji: "🎵",
    cover: null,
    duration: 180,
    playlists: ["all", "jay-wheeler"]
  },
  {
    id: 3,
    title: "Extrañándote",
    artist: "Zhamira & Jay Wheeler",
    album: "Single",
    src: "extranandote.mp3",
    emoji: "💙",
    cover: null,
    duration: 195,
    playlists: ["all", "jay-wheeler"]
  },
  {
    id: 4,
    title: "De Lejitos",
    artist: "Jay Wheeler",
    album: "Single",
    src: "de-lejitos.mp3",
    emoji: "🎶",
    cover: null,
    duration: 210,
    playlists: ["all", "jay-wheeler"]
  },
  {
    id: 5,
    title: "Ven Porque Te Necesito",
    artist: "Los Temerarios",
    album: "Single",
    src: "ven-porque-te.mp3",
    emoji: "🌹",
    cover: null,
    duration: 200,
    playlists: ["all", "temerarios"]
  },
  {
    id: 6,
    title: "Tu Última Canción",
    artist: "Los Temerarios",
    album: "Single",
    src: "tu-ultima-cancion.mp3",
    emoji: "🎸",
    cover: null,
    duration: 215,
    playlists: ["all", "temerarios"]
  },
  {
    id: 7,
    title: "Sé Que Te Amo",
    artist: "Los Temerarios",
    album: "Single",
    src: "se-que-te-amo.mp3",
    emoji: "💕",
    cover: null,
    duration: 205,
    playlists: ["all", "temerarios"]
  }
];

const PLAYLISTS = [
  { id: "all",         name: "Todas",        emoji: "🎵", color: "#1db954" },
  { id: "jay-wheeler", name: "Jay Wheeler",  emoji: "💚", color: "#1db954" },
  { id: "temerarios",  name: "Temerarios",   emoji: "🌹", color: "#e05252" }
];

function getAllSongs() { return [...LIBRARY]; }
function getSongById(id) { return LIBRARY.find(s => s.id === id) || null; }
function getSongsByPlaylist(playlistId) {
  if (playlistId === "all") return [...LIBRARY];
  return LIBRARY.filter(s => s.playlists.includes(playlistId));
}
function searchSongs(query) {
  if (!query || query.trim() === "") return [];
  const q = query.toLowerCase().trim();
  return LIBRARY.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.artist.toLowerCase().includes(q) ||
    s.album.toLowerCase().includes(q)
  );
}
function getFavorites() {
  try {
    const raw = localStorage.getItem("mf_favorites");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function toggleFavorite(songId) {
  const favs = getFavorites();
  const idx = favs.indexOf(songId);
  if (idx === -1) { favs.push(songId); }
  else { favs.splice(idx, 1); }
  localStorage.setItem("mf_favorites", JSON.stringify(favs));
  return favs.includes(songId);
}
function isFavorite(songId) { return getFavorites().includes(songId); }
function getFavoriteSongs() {
  return getFavorites().map(id => getSongById(id)).filter(Boolean);
}
