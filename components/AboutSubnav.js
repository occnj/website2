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
    function onScroll() {
      let current = active;
      SECTIONS.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) current = id;
      });
      setActive(current);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
