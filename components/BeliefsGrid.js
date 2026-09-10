'use client';
import { useState, useEffect, useRef } from 'react';

// Beliefs render as a compact card grid — title + scripture references only —
// so the full statements don't dominate the page. Clicking a card opens the
// complete text in a modal.
export default function BeliefsGrid({ items }) {
  const [openIndex, setOpenIndex] = useState(null);
  const closeRef = useRef(null);
  const lastFocused = useRef(null);
  const open = openIndex !== null ? items[openIndex] : null;

  // Close on Escape, lock background scroll, and move focus into the dialog so
  // keyboard and screen-reader users aren't left behind on the page underneath.
  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e) { if (e.key === 'Escape') setOpenIndex(null); }
    document.addEventListener('keydown', onKey);
    if (closeRef.current) closeRef.current.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (lastFocused.current && lastFocused.current.focus) lastFocused.current.focus();
    };
  }, [open]);

  if (!items || !items.length) return null;

  return (
    <>
      <div className="beliefs-grid">
        {items.map((b, i) => (
          <button
            type="button"
            className="belief-card"
            key={b.id || b.title}
            onClick={() => setOpenIndex(i)}
            aria-haspopup="dialog"
          >
            <span className="belief-card-title">{b.title}</span>
            {b.scripture ? <span className="belief-card-scripture">{b.scripture}</span> : null}
            <span className="belief-card-more">Read more →</span>
          </button>
        ))}
      </div>

      {open ? (
        <div className="belief-modal-backdrop" onClick={() => setOpenIndex(null)}>
          <div
            className="belief-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="belief-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="belief-modal-close"
              onClick={() => setOpenIndex(null)}
              aria-label="Close"
              ref={closeRef}
            >
              ×
            </button>
            <h3 className="belief-modal-title" id="belief-modal-title">{open.title}</h3>
            {open.scripture ? <p className="belief-modal-scripture">{open.scripture}</p> : null}
            <p className="belief-modal-text">{open.content}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
