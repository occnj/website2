// Pulls the latest videos from the Oasis YouTube channel (@OCCNJ) using the
// public RSS feed — no API key required. Results are cached for 30 minutes.
// If YouTube is unreachable, callers fall back to the Supabase `sermons` table.

export const YT_CHANNEL_ID = 'UCR4FqPSfjQAGy6jZB7OJ76w'; // youtube.com/@OCCNJ
export const YT_CHANNEL_URL = 'https://www.youtube.com/@OCCNJ';
export const YT_LIVE_URL = 'https://www.youtube.com/@OCCNJ/live';

// ---- LIVE STREAM SOURCE for the Watch page "WATCH LIVE" player ----
// platform: 'youtube' embeds the channel's live stream automatically.
// To switch to Twitch, set platform to 'twitch' and fill in the channel
// name (embed becomes player.twitch.tv/?channel=<name>&parent=<domain>).
export const LIVE_STREAM = {
  platform: 'youtube',
  twitchChannel: '', // e.g. 'occnj' — required only when platform is 'twitch'
  parentDomain: 'oasisnj.net', // your site domain, required by Twitch embeds
};

export function getLiveEmbedUrl() {
  if (LIVE_STREAM.platform === 'twitch' && LIVE_STREAM.twitchChannel) {
    return `https://player.twitch.tv/?channel=${LIVE_STREAM.twitchChannel}&parent=${LIVE_STREAM.parentDomain}&muted=true`;
  }
  // YouTube: auto-plays the channel's live broadcast when one is running,
  // and shows the channel's "offline / upcoming" state otherwise.
  return `https://www.youtube.com/embed/live_stream?channel=${YT_CHANNEL_ID}`;
}
export const YT_FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`;

function decodeEntities(s) {
  return (s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function pick(entry, tag) {
  const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].trim() : '';
}

// Returns videos shaped like `sermons` rows so existing components
// (SermonGrid, featured player) work unchanged:
// { id, youtube_id, title, description, speaker, series, published_at, thumbnail_url }
export async function getChannelVideos() {
  try {
    const res = await fetch(YT_FEED_URL, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const xml = await res.text();
    return xml
      .split('<entry>')
      .slice(1)
      .map((entry) => {
        const youtube_id = pick(entry, 'yt:videoId');
        if (!youtube_id) return null;
        return {
          id: youtube_id,
          youtube_id,
          title: decodeEntities(pick(entry, 'title')),
          description: decodeEntities(pick(entry, 'media:description')).split('\n')[0].slice(0, 220),
          speaker: 'Oasis Christian Centre',
          series: null,
          published_at: pick(entry, 'published') || null,
          thumbnail_url: `https://i.ytimg.com/vi/${youtube_id}/hqdefault.jpg`,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));
  } catch {
    return [];
  }
}
