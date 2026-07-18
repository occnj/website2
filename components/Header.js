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
  {
    label: 'Next Steps',
    dropdown: [
      { label: 'Teams', href: '/about#ministries' },
      { label: 'Prayer Request', href: '/prayer' },
      { label: 'Life Events', href: '/life-events' },
    ],
  },
  { label: 'Events', href: '/events' },
  { label: 'Leadership', href: '/leadership' },
  { label: 'Contact', href: '/contact' },
];

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
    ? navItems.map((n) => ({ label: n.label, href: normalizeHref(n.href) }))
    : STATIC_LINKS;
  const dropdownItem = STATIC_LINKS.find((l) => l.dropdown);

  return (
    <>
      <header className={'site-header' + (scrolled ? ' scrolled' : '')}>
        <div className="header-inner">
          <Link href="/" className="header-logo">
            <img src={asset('/uploads/logo-1776793086472.png')} alt="Oasis Christian Centre" />
            <span>
              Oasis Christian Centre
              <span className="logo-sub">Rahway, NJ</span>
            </span>
          </Link>
          <nav className="primary-nav">
            {links.map((link, i) => (
              <div className="nav-item" key={link.label}>
                {link.dropdown ? (
                  <>
                    <button type="button" className="nav-link" aria-haspopup="true">
                      {link.label}
                      <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 10L3 5h10z" /></svg>
                    </button>
                    <div className="nav-dropdown">
                      {link.dropdown.map((d) => (
                        <Link href={d.href} key={d.label}>
                          <strong style={{ display: 'block', fontSize: '.88rem', fontWeight: 500 }}>{d.label}</strong>
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link href={link.href} className={'nav-link' + (pathname === link.href ? ' active' : '')}>
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
            {navItems && navItems.length && dropdownItem ? (
              <div className="nav-item">
                <button type="button" className="nav-link" aria-haspopup="true">
                  {dropdownItem.label}
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 10L3 5h10z" /></svg>
                </button>
                <div className="nav-dropdown">
                  {dropdownItem.dropdown.map((d) => (
                    <Link href={d.href} key={d.label}>
                      <strong style={{ display: 'block', fontSize: '.88rem', fontWeight: 500 }}>{d.label}</strong>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
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
          link.dropdown ? (
            <span key={link.label}>
              <span className="mobile-section-label">{link.label}</span>
              {link.dropdown.map((d) => (
                <Link href={d.href} key={d.label} className="mobile-sub" onClick={() => setMobileOpen(false)}>{d.label}</Link>
              ))}
            </span>
          ) : (
            <Link href={link.href} key={link.label} className={pathname === link.href ? 'active' : ''} onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          )
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
