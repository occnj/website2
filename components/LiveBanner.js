'use client';

import TextVariants from './TextVariants';
import useLiveNow from './useLiveNow';

export default function LiveBanner() {
  const live = useLiveNow();

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
            <span hidden={!live} data-cms-scope="live-banner-live" style={{ display: live ? 'inline-flex' : 'none', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span className="live-badge"><span className="live-dot"></span>Live Now</span>
                <span style={{ fontSize: '.9rem', fontWeight: 500 }}>Sunday Service is streaming live right now</span>
              </span>
              <span hidden={live} data-cms-scope="live-banner-offline" style={{ fontSize: '.9rem', fontWeight: 500, opacity: .85 }}>
                We stream live every Sunday at 10:00 AM EST
              </span>
          </div>
          {live ? (
            <a href="#live" className="btn btn-ghost btn-sm">
              <TextVariants id="live-banner-link" active="live" variants={{ live: 'Join the Stream ↓' }} />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
