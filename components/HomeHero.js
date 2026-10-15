'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LivePlayer from './LivePlayer';
import { useSiteData } from './SiteDataContext';
import { isLiveInBrowser } from '@/lib/serviceWindow';

// Home page hero. During the Sunday stream window (9:55 AM by default — Admin →
// Livestream & Service Times) it becomes the livestream, and switches back when
// the window ends. Re-checked every 20 seconds, so an open page flips over
// without a reload. Preview without changing anything for others: /?live=1,
// /?live=0, or /?now=2026-10-18T09:55.
export default function HomeHero({ initialLive, children }) {
  const { settings } = useSiteData();
  const [live, setLive] = useState(!!initialLive);
  const channel = (settings && settings.twitch_channel) || 'occnj';

  useEffect(() => {
    const check = () => setLive(isLiveInBrowser(settings));
    check();
    const t = setInterval(check, 20 * 1000);
    return () => clearInterval(t);
  }, [settings]);

  if (!live) return children;

  return (
    <section className="hero-home hero-live" data-screen-label="Live Hero">
      <div className="hero-bg-placeholder"></div>
      <div className="hero-bg-pattern"></div>
      <div className="hero-content-wrap">
        <div className="container">
          <div className="hero-live-grid">
            <div>
              <span className="live-badge"><span className="live-dot"></span>Live Now</span>
              <h1 className="hero-headline mt-2">We&rsquo;re live. Join us for Sunday Service.</h1>
              <p className="hero-sub">Worship, the Word and community — happening right now. Join us from wherever you are; you&rsquo;re part of the family.</p>
              <div className="hero-actions">
                <Link href="/watch#live" className="btn btn-primary btn-lg">Watch Full Page</Link>
                <Link href="/plan-your-visit" className="btn btn-ghost btn-lg">Plan Your Visit</Link>
              </div>
              <p className="hero-live-note">On phones, press play if the stream doesn&rsquo;t start by itself.</p>
            </div>
            <div className="hero-live-player">
              <LivePlayer twitch_channel={channel} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
