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
  { label: 'Plan Your Visit', href: '/plan-your-visit' },
  { label: 'Watch', href: '/watch' },
  { label: 'Events', href: '/events' },
  { label: 'Leadership', href: '/leadership' },
  { label: 'Contact', href: '/contact' },
  { label: 'Prayer Request', href: '/prayer' },
];

const REMOVED_NAV_LABELS = new Set(['teams', 'life events', 'next steps', 'prayer', 'prayer request']);

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { navItems, settings } = useSiteData();

  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        const next = window.scrollY > 20;
        setScrolled((prev) => (prev === next ? prev : next));
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = navItems && navItems.length
    ? [
        ...navItems
          .filter((n) => !REMOVED_NAV_LABELS.has((n.label || '').trim().toLowerCase()))
          .map((n) => ({ label: n.label, href: normalizeHref(n.href) })),
        { label: 'Prayer Request', href: '/prayer' },
      ]
    : STATIC_LINKS;

  return (
    <>
      <header className={'site-header' + (scrolled ? ' scrolled' : '')}>
        <div className="header-inner">
          <Link href="/" className="header-logo">
            <img src={asset('/uploads/oasis-logo.png')} alt="Oasis Christian Centre" />
          </Link>
          <nav className="primary-nav">
            {links.map((link, i) => (
              <div className="nav-item" key={link.label}>
                <Link href={link.href} className={'nav-link' + (pathname === link.href ? ' active' : '')}>
                  {link.label}
                </Link>
              </div>
            ))}
          </nav>
          <div className="header-cta">
            <SocialLinks settings={settings} className="header-social" />
            <GiveLink className="btn btn-amber btn-sm">Give</GiveLink>
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
          <Link href={link.href} key={link.label} className={pathname === link.href ? 'active' : ''} onClick={() => setMobileOpen(false)}>
            {link.label}
          </Link>
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
