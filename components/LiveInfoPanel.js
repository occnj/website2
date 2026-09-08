'use client';

import { useEffect, useState } from 'react';
import TextVariants from './TextVariants';
import { TWITCH_CHANNEL_URL } from './TwitchEmbed';
import { YT_CHANNEL_URL } from '@/lib/youtube';
import { isServiceWindowNow } from '@/lib/serviceWindow';

export default function LiveInfoPanel() {
  const [live, setLive] = useState(false);

  useEffect(() => {
    setLive(isServiceWindowNow());
    const t = setInterval(() => setLive(isServiceWindowNow()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="featured-sermon-info">
      {/* Live / offline badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: live ? 'rgba(197,48,48,.2)' : 'rgba(255,255,255,.08)',
        borderRadius: 100, padding: '4px 14px',
        fontSize: '.7rem', fontWeight: 700, letterSpacing: '.1em',
        textTransform: 'uppercase',
        color: live ? '#E05252' : 'rgba(255,255,255,.5)',
        marginBottom: 'var(--sp-2)',
        transition: 'background .4s, color .4s',
      }}>
        <span className="live-dot" style={{ background: live ? '#E05252' : 'rgba(255,255,255,.3)' }}></span>
        <TextVariants id="live-info-badge" active={live ? 'live' : 'offline'} variants={{ live: 'Live Now', offline: 'Live Stream' }} />
      </div>

      {/* Heading */}
      <h2 className="t-h2 text-white">
        <TextVariants id="live-info-heading" active={live ? 'live' : 'offline'} variants={{ live: "We're Live!", offline: 'Watch Now Live' }} />
      </h2>

      {/* Body copy — changes when live */}
      <div hidden={!live} data-cms-scope="live-info-live">
          <p style={{ color: 'rgba(255,255,255,.8)', marginTop: 'var(--sp-2)', fontSize: '.95rem', lineHeight: 1.65 }}>
            Sunday service is happening right now. Jump in — worship, message, and community, all live.
          </p>
          <p style={{ color: 'rgba(255,255,255,.5)', marginTop: 'var(--sp-2)', fontSize: '.82rem', lineHeight: 1.6 }}>
            On mobile, press play if the stream doesn&rsquo;t start automatically.
          </p>
        </div>
        <div hidden={live} data-cms-scope="live-info-offline">
          <p style={{ color: 'rgba(255,255,255,.65)', marginTop: 'var(--sp-2)', fontSize: '.9rem', lineHeight: 1.65 }}>
            Join us for our live stream every Sunday morning at 10:00 AM EST. If the player doesn&rsquo;t load automatically, please refresh the page.
          </p>
          <p style={{ color: 'rgba(255,255,255,.5)', marginTop: 'var(--sp-2)', fontSize: '.82rem', lineHeight: 1.6 }}>
            On mobile devices, press play to begin the stream after 10:00 AM EST.
          </p>
        </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-4)', flexWrap: 'wrap' }}>
        <a href={TWITCH_CHANNEL_URL} target="_blank" rel="noopener"
          className={live ? 'btn btn-primary btn-lg' : 'btn btn-primary'}>
          <TextVariants id="live-info-link" active={live ? 'live' : 'offline'} variants={{ live: '▶ Watch Live Now', offline: 'Watch on Twitch' }} />
        </a>
        <a href={YT_CHANNEL_URL} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
          Past Messages on YouTube →
        </a>
      </div>
    </div>
  );
}
