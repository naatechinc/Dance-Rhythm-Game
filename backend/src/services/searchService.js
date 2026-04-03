/**
 * searchService.js
 * Proxies queries to the YouTube Data API v3 and normalises results
 * into the TrackMetadata shape used across the app.
 */

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * @param {string} query
 * @returns {Promise<TrackMetadata[]>}
 */
async function search(query) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn('[searchService] YOUTUBE_API_KEY not set — returning stub results');
    return stubResults(query);
  }

  const url = new URL(`${YOUTUBE_API_BASE}/search`);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('videoCategoryId', '10'); // Music
  url.searchParams.set('maxResults', '8');
  url.searchParams.set('q', query);
  url.searchParams.set('key', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API error ${res.status}: ${body}`);
  }

  const data = await res.json();

  // Fetch durations via videos endpoint
  const ids = data.items.map((i) => i.id.videoId).join(',');
  const detailsUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
  detailsUrl.searchParams.set('part', 'contentDetails,snippet');
  detailsUrl.searchParams.set('id', ids);
  detailsUrl.searchParams.set('key', apiKey);

  const detailsRes = await fetch(detailsUrl.toString());
  const detailsData = detailsRes.ok ? await detailsRes.json() : { items: [] };
  const detailsMap = Object.fromEntries(detailsData.items.map((i) => [i.id, i]));

  return data.items.map((item) => {
    const videoId = item.id.videoId;
    const detail = detailsMap[videoId];
    return {
      videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? null,
      durationSec: detail ? parseDuration(detail.contentDetails.duration) : null,
      source: 'youtube',
      language: 'en',
    };
  });
}

/**
 * Parse ISO 8601 duration (PT4M13S) to seconds.
 */
function parseDuration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const [, h = 0, m = 0, s = 0] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

/**
 * Stub results used when no API key is configured (dev/testing).
 */
function stubResults(query) {
  return [
    {
      videoId: 'dQw4w9WgXcQ',
      title: `[STUB] Result for "${query}"`,
      artist: 'Test Artist',
      thumbnail: null,
      durationSec: 214,
      source: 'youtube',
      language: 'en',
    },
  ];
}

module.exports = { search };
