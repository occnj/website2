'use client';

import { useState, useEffect, useCallback } from 'react';

// Orientation-aware photo gallery with a lightbox. Accepts an array of image
// URLs (portrait and landscape mix). Grid uses masonry-ish columns so portrait
// and landscape both sit naturally; clicking opens a full-screen overlay with
// prev/next and keyboard support.
export default function PostGallery({ images }) {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const show = useCallback((i) => { setIdx(i); setOpen(true); }, []);
  const close = useCallback(() => setOpen(false), []);
  const prev = useCallback(() => setIdx((i) => (i - 1 + list.length) % list.length), [list.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % list.length), [list.length]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, close, prev, next]);

  if (!list.length) return null;

  return (
    <div className="post-gallery-wrap">
      <h2 className="post-gallery-heading">Photo Gallery</h2>
      <div className="post-gallery-grid">
        {list.map((url, i) => (
          <button type="button" className="post-gallery-item" key={url + i} onClick={() => show(i)} aria-label={`Open photo ${i + 1}`}>
            <img src={url} alt={`Gallery photo ${i + 1}`} loading="lazy" />
          </button>
        ))}
      </div>

      {open && (
        <div className="lightbox" onClick={close} role="dialog" aria-modal="true">
          <button type="button" className="lightbox-close" onClick={close} aria-label="Close">×</button>
          {list.length > 1 && (
            <button type="button" className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous">‹</button>
          )}
          <img className="lightbox-img" src={list[idx]} alt={`Gallery photo ${idx + 1}`} onClick={(e) => e.stopPropagation()} />
          {list.length > 1 && (
            <button type="button" className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next">›</button>
          )}
          <div className="lightbox-count">{idx + 1} / {list.length}</div>
        </div>
      )}
    </div>
  );
}
