/**
 * spotifyService.js
 * Fetches real BPM, energy, danceability, and key from Spotify's API.
 * Uses Client Credentials flow — no user login needed.
 * 
 * Returns audio features for a track:
 *   bpm, energy (0-1), danceability (0-1), key, mode, timeSignature
 */

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Get a Spotify access token via Client Credentials.
 */
async function getToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 5000) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error(`Spotify token error: ${res.status}`);
  const data = await res.json();

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

/**
 * Search Spotify for a track by title + artist.
 * Returns the first match's track ID.
 */
async function searchTrack(title, artist = '') {
  const token = await getToken();
  const q = encodeURIComponent(`${title} ${artist}`.trim().slice(0, 100));

  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error(`Spotify search error: ${res.status}`);
  const data = await res.json();
  const track = data.tracks?.items?.[0];
  if (!track) return null;

  return {
    spotifyId: track.id,
    name: track.name,
    artist: track.artists?.[0]?.name,
    durationMs: track.duration_ms,
  };
}

/**
 * Get audio features for a Spotify track ID.
 * Returns BPM and other musical characteristics.
 */
async function getAudioFeatures(spotifyId) {
  const token = await getToken();

  const res = await fetch(
    `https://api.spotify.com/v1/audio-features/${spotifyId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error(`Spotify features error: ${res.status}`);
  const data = await res.json();

  return {
    bpm: Math.round(data.tempo),
    energy: data.energy,           // 0-1, intensity
    danceability: data.danceability, // 0-1, how danceable
    key: data.key,                 // 0-11 (C=0, C#=1, ...)
    mode: data.mode,               // 0=minor, 1=major
    timeSignature: data.time_signature, // usually 4
    valence: data.valence,         // 0-1, positivity/happiness
    loudness: data.loudness,       // dB
  };
}

/**
 * Main function: given a track title + artist, return BPM and features.
 * Falls back gracefully if Spotify is unavailable.
 */
async function getBpmForTrack(title, artist = '') {
  try {
    const track = await searchTrack(title, artist);
    if (!track) return null;

    const features = await getAudioFeatures(track.spotifyId);
    console.log(`[spotify] ${title} → BPM: ${features.bpm}, energy: ${features.energy?.toFixed(2)}, dance: ${features.danceability?.toFixed(2)}`);

    return {
      ...features,
      spotifyId: track.spotifyId,
      spotifyName: track.name,
      spotifyArtist: track.artist,
    };
  } catch (err) {
    console.warn(`[spotify] Could not get BPM for "${title}": ${err.message}`);
    return null;
  }
}

module.exports = { getBpmForTrack };
