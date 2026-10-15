'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Back / Forward / refresh return to where you were on the page.
//
// The pages render their content from the database, so by the time the
// browser's own restore runs the page is often still short (or about to
// change), and you landed somewhere random. Instead we remember the scroll
// position of every page in this tab and, on Back/Forward or refresh, keep
// putting it back until the page has rendered tall enough and settled —
// unless the visitor starts scrolling first. Links to #sections still work as
// usual (and land below the fixed header via scroll-margin-top).

const PREFIX = 'oasis-scroll:';
const keyFor = () => PREFIX + window.location.pathname + window.location.search;

function read(key) {
  try { const v = sessionStorage.getItem(key); return v == null ? null : Number(v); } catch { return null; }
}
function save() {
  try { sessionStorage.setItem(keyFor(), String(Math.round(window.scrollY))); } catch { /* storage blocked */ }
}

let target = null; // { key, y, until }
let raf = 0;

function stopRestore() {
  target = null;
  cancelAnimationFrame(raf);
  document.documentElement.classList.remove('hdr-instant');
}

function tick() {
  if (!target) return;
  if (Date.now() > target.until || keyFor() !== target.key) return stopRestore();
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max >= target.y - 2 && Math.abs(window.scrollY - target.y) > 1) {
    window.scrollTo({ top: target.y, left: 0, behavior: 'instant' });
  }
  raf = requestAnimationFrame(tick);
}

function restore(key, y, ms) {
  if (y == null || isNaN(y)) return;
  cancelAnimationFrame(raf);
  target = { key, y, until: Date.now() + ms };
  document.documentElement.classList.add('hdr-instant');
  raf = requestAnimationFrame(tick);
}

export default function ScrollRestorer() {
  const pathname = usePathname();

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    let timer = 0;
    const onScroll = () => { clearTimeout(timer); timer = setTimeout(save, 100); };
    // Record the position at the moment a link is followed (before Next.js
    // changes the URL), and when the page is left or hidden.
    const onClick = (e) => { if (e.target.closest && e.target.closest('a[href]')) save(); };
    const onPop = () => restore(keyFor(), read(keyFor()), 2500);
    const onUserScroll = () => { if (target) stopRestore(); };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPop);
    window.addEventListener('pagehide', save);
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((ev) => window.addEventListener(ev, onUserScroll, { passive: true }));

    // Full page load: put a refreshed page (or one reached with the browser's
    // Back button from another site) back where it was.
    const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (nav && (nav.type === 'reload' || nav.type === 'back_forward')) restore(keyFor(), read(keyFor()), 2500);

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('pagehide', save);
      ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((ev) => window.removeEventListener(ev, onUserScroll));
      stopRestore();
    };
  }, []);

  // A Back/Forward that changed page: give the new page time to render.
  useEffect(() => {
    if (target && target.key === keyFor()) target.until = Math.max(target.until, Date.now() + 1200);
  }, [pathname]);

  return null;
}
