'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GiveLink from './GiveLink';
import { useSiteData } from './SiteDataContext';
import { asset } from '@/lib/basePath';
import SocialLinks from './SocialLinks';

function normalizeHref(href) {
  if (!href) return '/';
  const h = href.trim();
  if (/^https?:\/\//.test(h) || h.startsWith('#') || h.startsWith('mailto:')) return h;
  let path = h.replace(/\.html$/i, '');
  if (path === 'index' || path === '') return '/';
  if (!path.startsWith('/')) path = '/' + path;
  return path;
}

const STATIC_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Ministries', href: '/ministries' },
  { label: 'Serve', href: '/serve' },
  { label: 'Plan Your Visit', href: '/plan-your-visit' },
  { label: 'Watch', href: '/watch' },
  { label: 'Events', href: '/events' },
  { label: 'Contact', href: '/contact' },
  { label: 'Prayer Request', href: '/prayer' },
];

const REMOVED_NAV_LABELS = new Set(['teams', 'life events', 'next steps', 'prayer', 'prayer request', 'leadership']);

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { navItems, settings } = useSiteData();

  // Floating (transparent) vs solid is NOT React state: the inline script in
  // app/layout.js sets `hdr-solid` on <html> before the first paint and on every
  // scroll, so the bar is already right when a refreshed page restores its
  // scroll position (that mismatch was the navbar flash).

  // Close the mobile menu when the route changes.
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Lock background scroll while the mobile menu is open so the page behind
  // the drawer can't move.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  // Site-wide floating header: the bar is transparent at the top of every page
  // so the logo + nav float over the content/hero, and turns solid as soon as
  // the user scrolls (see globals.css, `hdr-solid`).

  const podcastUrl = settings && settings.podcast_nav_url ? settings.podcast_nav_url.trim() : '';

  const links = navItems && navItems.length
    ? [
        ...navItems
          .filter((n) => !REMOVED_NAV_LABELS.has((n.label || '').trim().toLowerCase()))
          .map((n) => ({ label: n.label, href: normalizeHref(n.href) })),
        { label: 'Prayer Request', href: '/prayer' },
        ...(podcastUrl ? [{ label: 'Podcast', href: podcastUrl, external: true }] : []),
      ]
    : [
        ...STATIC_LINKS,
        ...(podcastUrl ? [{ label: 'Podcast', href: podcastUrl, external: true }] : []),
      ];

  return (
    <>
      <header className={'site-header' + (mobileOpen ? ' menu-open' : '')}>
        <div className="header-inner">
          <Link href="/" className="header-logo">
            <img src={asset('/uploads/oasis-logo.png')} alt="Oasis Christian Centre" className="logo-desktop logo-light" />
            <img src={asset('/uploads/OCC_Logo_Dark-01.png')} alt="Oasis Christian Centre" className="logo-desktop logo-dark" />
            <img src={asset('/uploads/logo-1776793086472.png')} alt="Oasis Christian Centre" className="logo-mobile" />
          </Link>
          <nav className="primary-nav">
            {links.map((link, i) => (
              <div className="nav-item" key={link.label}>
                {link.external
                  ? <a href={link.href} className="nav-link" target="_blank" rel="noopener noreferrer">{link.label}</a>
                  : <Link href={link.href} className={'nav-link' + (pathname === link.href ? ' active' : '')}>{link.label}</Link>
                }
              </div>
            ))}
          </nav>
          <div className="header-cta">
            <SocialLinks settings={settings} className="header-social" />
            <GiveLink className="btn btn-amber btn-sm header-give">Give</GiveLink>
            <button
              className={'nav-toggle' + (mobileOpen ? ' active' : '')}
              aria-label="Menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </header>
      <nav id="mobile-navigation" aria-label="Mobile navigation" className={'mobile-nav' + (mobileOpen ? ' open' : '')}>
        {links.map((link) => (
          link.external
            ? <a href={link.href} key={link.label} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}>{link.label}</a>
            : <Link href={link.href} key={link.label} className={pathname === link.href ? 'active' : ''} onClick={() => setMobileOpen(false)}>{link.label}</Link>
        ))}
        <div className="mobile-cta flex" style={{ gap: 12, flexWrap: 'wrap' }}>
          <SocialLinks settings={settings} className="mobile-social" />
          <GiveLink className="btn btn-amber full-w">Give</GiveLink>
          <Link href="/plan-your-visit" className="btn btn-secondary full-w">Plan Your Visit</Link>
        </div>
      </nav>
    </>
  );
}
