'use client';

import { useEffect, useState } from 'react';
import { useSiteData } from './SiteDataContext';

// Default Twitch channel for Oasis (matches @occnj handles used on
// facebook/instagram/twitter/vimeo). Can be overridden without a deploy by
// adding a `twitch_channel` value in Admin → Settings (site_settings table).
export const TWITCH_CHANNEL = 'occnj';
export const TWITCH_CHANNEL_URL = `https://www.twitch.tv/${TWITCH_CHANNEL}`;

// Twitch embeds require a `parent` query param that exactly matches the
// domain the page is served from — otherwise the player refuses to load.
// That's why this is a client component: the hostname is read at runtime,
// so the same code works on localhost, staging, and oasisnj.net.
export default function TwitchEmbed() {
  const { settings } = useSiteData();
  const channel = (settings && settings.twitch_channel) || TWITCH_CHANNEL;
  const [parent, setParent] = useState(null);

  useEffect(() => {
    setParent(window.location.hostname);
  }, []);

  if (!parent) {
    return (
      <div className="img-placeholder img-placeholder-dark" style={{ position: 'absolute', inset: 0, height: '100%', minHeight: 340 }}>
        <span>Loading live player…</span>
      </div>
    );
  }

  const src =
    `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}` +
    `&parent=${encodeURIComponent(parent)}` +
    '&autoplay=true&muted=true';

  return (
    <iframe
      src={src}
      title="Oasis Christian Centre — Live Stream"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
      allow="autoplay; fullscreen"
      allowFullScreen
    />
  );
}
