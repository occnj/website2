'use client';

import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// LivePlayer — the Twitch live stream (the YouTube and Facebook tabs were
// removed in the October 2026 redesign; the stream is watched on Twitch).
//   twitch_channel  e.g. "occnj" (Admin → Navigation & Site Info)
// Twitch needs a `parent` param matching the page's host, so it's read at runtime.
// ---------------------------------------------------------------------------

export default function LivePlayer({ twitch_channel }) {
  const [parent, setParent] = useState('');

  useEffect(() => {
    setParent(window.location.hostname);
  }, []);

  if (!twitch_channel) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#18181b', color: 'rgba(255,255,255,.4)', fontFamily: 'system-ui', fontSize: '.9rem', gap: 8 }}>
        <span>Live stream not configured.</span>
        <span style={{ fontSize: '.78rem' }}>Set the Twitch channel in Admin → Navigation &amp; Site Info.</span>
      </div>
    );
  }

  if (!parent) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.4)', fontFamily: 'system-ui', fontSize: '.9rem' }}>
        Loading player…
      </div>
    );
  }

  const src = `https://player.twitch.tv/?channel=${encodeURIComponent(twitch_channel)}&parent=${encodeURIComponent(parent)}&autoplay=true&muted=true`;
  return (
    <iframe
      src={src}
      title="Oasis Christian Centre — Live Stream"
      allow="autoplay; fullscreen"
      allowFullScreen
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
    />
  );
}
