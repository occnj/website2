'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const SECTIONS = [
  { id: 'our-story', label: 'Our Story' },
  { id: 'our-values', label: 'Our Values' },
  { id: 'our-beliefs', label: 'Our Beliefs' },
  { id: 'ministries', label: 'Ministries' },
  { id: 'missions', label: 'Missions' },
  { id: 'serve', label: 'Serve' },
];

export default function AboutSubnav() {
  const [active, setActive] = useState('our-story');

  useEffect(() => {
    let ticking = false;

    function compute() {
      ticking = false;
      let current = SECTIONS[0].id;
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) current = id;
      }
      // Functional update: React skips the re-render entirely when the
      // value is unchanged, so scrolling within a section no longer repaints
      // the sub-nav (which was causing the flicker).
      setActive((prev) => (prev === current ? prev : current));
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(compute);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    compute();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="about-subnav" data-screen-label="About Sub-Nav">
      <div className="about-subnav-inner">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={'#' + s.id}
            className={'subnav-link' + (active === s.id ? ' active' : '')}
            onClick={() => setActive(s.id)}
          >
            {s.label}
          </a>
        ))}
        <Link href="/leadership" className="subnav-link">Leadership</Link>
      </div>
    </div>
  );
}
