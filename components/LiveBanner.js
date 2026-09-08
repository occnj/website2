'use client';

import { useEffect, useState } from 'react';
import TextVariants from './TextVariants';
import { TWITCH_CHANNEL_URL } from './TwitchEmbed';
import { isServiceWindowNow } from '@/lib/serviceWindow';

export default function LiveBanner() {
  const [live, setLive] = useState(false);

  useEffect(() => {
    setLive(isServiceWindowNow());
    const t = setInterval(() => setLive(isServiceWindowNow()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        background: live ? 'linear-gradient(90deg,#8B0000,#C53030)' : 'var(--charcoal-2)',
        padding: 'var(--sp-2) 0',
        transition: 'background .3s',
      }}
      data-screen-label="Live Banner"
    >
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', color: '#fff' }}>
            <span hidden={!live} data-cms-scope="live-banner-live">
                <span className="live-badge"><span className="live-dot"></span>Live Now</span>
                <span style={{ fontSize: '.9rem', fontWeight: 500 }}>Sunday Service is streaming live right now</span>
              </span>
              <span hidden={live} data-cms-scope="live-banner-offline" style={{ fontSize: '.9rem', fontWeight: 500, opacity: .85 }}>
                We stream live every Sunday at 10:00 AM EST
              </span>
          </div>
          <a href={TWITCH_CHANNEL_URL} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
            <TextVariants id="live-banner-link" active={live ? 'live' : 'offline'} variants={{ live: 'Join the Stream →', offline: 'Watch on Twitch →' }} />
          </a>
        </div>
      </div>
    </div>
  );
}
