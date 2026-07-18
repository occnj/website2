'use client';

import { useEffect, useState } from 'react';
import { isServiceWindowNow } from '@/lib/serviceWindow';

// ---------------------------------------------------------------------------
// LivePlayer — tabbed embed for Twitch, YouTube Live, Facebook Live.
// Props come from site_settings (fetched server-side, passed in).
//   twitch_channel    e.g. "occnj"
//   youtube_channel   e.g. "UCR4FqPSfjQAGy6jZB7OJ76w" (channel ID) or a live video ID
//   facebook_page_id  e.g. "OasisChristianCentreNJ" (page username or numeric ID)
//   live_default_tab  "twitch" | "youtube" | "facebook"  (default: "twitch")
// ---------------------------------------------------------------------------

const TABS = [
  { id: 'twitch',   label: 'Twitch',   icon: '📺' },
  { id: 'youtube',  label: 'YouTube',  icon: '▶' },
  { id: 'facebook', label: 'Facebook', icon: 'f' },
];

function TwitchFrame({ channel, parent }) {
  if (!channel) return <Unavailable platform="Twitch" />;
  const src = `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${encodeURIComponent(parent)}&autoplay=true&muted=true`;
  return <iframe src={src} title="Twitch Live" allow="autoplay; fullscreen" allowFullScreen style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:0 }} />;
}

function YouTubeFrame({ channelId }) {
  if (!channelId) return <Unavailable platform="YouTube" />;
  // If it looks like a video ID (11 chars), embed as video; otherwise embed channel live
  const isVideoId = /^[a-zA-Z0-9_-]{11}$/.test(channelId);
  const src = isVideoId
    ? `https://www.youtube.com/embed/${channelId}?autoplay=1&mute=1`
    : `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1`;
  return <iframe src={src} title="YouTube Live" allow="autoplay; fullscreen" allowFullScreen style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:0 }} />;
}

function FacebookFrame({ pageId }) {
  if (!pageId) return <Unavailable platform="Facebook" />;
  // Facebook requires the page URL, not just the ID
  const pageUrl = pageId.startsWith('http') ? pageId : `https://www.facebook.com/${pageId}`;
  const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(pageUrl + '/live')}&show_text=false&autoplay=true&width=720`;
  return <iframe src={src} title="Facebook Live" allow="autoplay; fullscreen" allowFullScreen scrolling="no" style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:0 }} />;
}

function Unavailable({ platform }) {
  return (
    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#18181b', color:'rgba(255,255,255,.4)', fontFamily:'system-ui', fontSize:'.9rem', gap:8 }}>
      <span style={{ fontSize:'2rem' }}>📡</span>
      <span>{platform} stream not configured.</span>
      <span style={{ fontSize:'.78rem' }}>Set the {platform} channel in Admin → Settings.</span>
    </div>
  );
}

export default function LivePlayer({ twitch_channel, youtube_channel, facebook_page_id, live_default_tab }) {
  const defaultTab = live_default_tab || 'twitch';
  const [tab, setTab] = useState(defaultTab);
  const [parent, setParent] = useState('');

  useEffect(() => {
    setParent(window.location.hostname);
  }, []);

  if (!parent) {
    return (
      <div style={{ position:'absolute', inset:0, background:'#18181b', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.4)', fontFamily:'system-ui', fontSize:'.9rem' }}>
        Loading player…
      </div>
    );
  }

  return (
    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column' }}>
      {/* Tab bar */}
      <div style={{ display:'flex', background:'#0e0e10', borderBottom:'1px solid rgba(255,255,255,.1)', flexShrink:0 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex:1, padding:'10px 4px', border:0, background:'transparent', cursor:'pointer',
              color: tab === t.id ? '#fff' : 'rgba(255,255,255,.4)',
              borderBottom: tab === t.id ? '2px solid #9147ff' : '2px solid transparent',
              fontSize:'.78rem', fontWeight:600, fontFamily:'system-ui', letterSpacing:'.04em',
              display:'flex', alignItems:'center', justifyContent:'center', gap:5,
              transition:'color .15s',
            }}
          >
            <span style={{ fontSize:'.9rem' }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Player area */}
      <div style={{ position:'relative', flex:1 }}>
        {tab === 'twitch'   && <TwitchFrame   channel={twitch_channel}   parent={parent} />}
        {tab === 'youtube'  && <YouTubeFrame  channelId={youtube_channel} />}
        {tab === 'facebook' && <FacebookFrame pageId={facebook_page_id} />}
      </div>
    </div>
  );
}
