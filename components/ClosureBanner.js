'use client';

import { useSiteData } from './SiteDataContext';

// Renders a fixed red banner just below the nav when closure_notice is set.
// Visible on every page so visitors immediately know when the church is closed.
export default function ClosureBanner() {
  const { settings } = useSiteData();
  const notice = settings && settings.closure_notice ? settings.closure_notice.trim() : '';
  if (!notice) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 'var(--header-h)',
      left: 0,
      right: 0,
      zIndex: 99,
      background: '#7B2D2D',
      color: '#fff',
      padding: '10px 24px',
      textAlign: 'center',
      fontSize: '.9rem',
      fontWeight: 600,
      lineHeight: 1.5,
      boxShadow: '0 2px 8px rgba(0,0,0,.25)',
    }}>
      ⚠️ {notice}
    </div>
  );
}
