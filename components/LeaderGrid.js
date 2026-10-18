'use client';

import { useEffect, useRef, useState } from 'react';

// Team cards (About → Leadership and /leadership). Long biographies are shown
// as a four-line preview with a "Read more" button that opens the full bio in a
// dialog. Paragraphs (blank lines or line breaks, as typed in the admin) are
// kept. The full text stays in the page — the card only hides the overflow —
// so search engines (and scripts/import-team.mjs) still see all of it.

const LONG_BIO_CHARS = 180; // used until the browser has measured the cards

export function bioParagraphs(bio) {
  return String(bio || '')
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function isLong(paragraphs) {
  return paragraphs.length > 1 || (paragraphs[0] || '').length > LONG_BIO_CHARS;
}

function Links({ links }) {
  if (!links || !(links.instagram || links.facebook || links.email)) return null;
  return (
    <div className="leader-links">
      {links.instagram ? <a href={links.instagram} target="_blank" rel="noopener noreferrer">Instagram</a> : null}
      {links.facebook ? <a href={links.facebook} target="_blank" rel="noopener noreferrer">Facebook</a> : null}
      {links.email ? <a href={`mailto:${links.email}`}>Email</a> : null}
    </div>
  );
}

function Photo({ member }) {
  // First letters of the first two real words ("Albert & Ruth Perez" → "AR").
  const initials = (member.name || '').split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).map((w) => w[0].toUpperCase()).slice(0, 2).join('');
  return member.photo_url ? (
    <img src={member.photo_url} alt={member.name} />
  ) : (
    <div className="img-placeholder" style={{ height: '100%', minHeight: 280 }}>
      <span style={{ fontFamily: 'var(--font-head)', fontSize: '2.4rem', color: '#9BABB6' }}>{initials}</span>
    </div>
  );
}

// compact: smaller cards, six to a row, bio only in the dialog — for big
// groups like the ministry leaders. Until "Show all" is pressed only the first
// two rows show (12 on a computer, 6 on a phone — see leadership.css).
export default function LeaderGrid({ members, compact = false }) {
  const [openId, setOpenId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  // Which bios actually overflow four lines (measured in the browser), so every
  // card is cut at the same height and only those get "Read more".
  const [overflowing, setOverflowing] = useState(null);
  const gridRef = useRef(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      const ids = new Set();
      grid.querySelectorAll('.leader-bio[data-id]').forEach((el) => {
        if (el.scrollHeight > el.clientHeight + 2) ids.add(el.dataset.id);
      });
      setOverflowing(ids);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [members]);
  const closeRef = useRef(null);
  const lastFocused = useRef(null);
  const open = openId != null ? (members || []).find((m) => m.id === openId) : null;

  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setOpenId(null); };
    document.addEventListener('keydown', onKey);
    if (closeRef.current) closeRef.current.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (lastFocused.current && lastFocused.current.focus) lastFocused.current.focus();
    };
  }, [open]);

  if (!members || !members.length) return null;

  return (
    <>
      {compact ? (
        <div className={'leader-grid leader-grid-compact' + (showAll ? '' : ' is-collapsed')} data-team-list>
          {members.map((t) => (
            <button
              type="button"
              className="leader-card leader-card-compact"
              key={t.id}
              onClick={() => setOpenId(t.id)}
              aria-haspopup="dialog"
            >
              <div className="leader-photo"><Photo member={t} /></div>
              <div className="leader-info">
                <div className="leader-name">{t.name}</div>
                <div className="leader-role">{t.role_title}</div>
                {bioParagraphs(t.bio).length ? <span className="leader-more">Read bio →</span> : null}
              </div>
            </button>
          ))}
        </div>
      ) : (
      <div className="leader-grid" data-team-list ref={gridRef}>
        {members.map((t) => {
          const paras = bioParagraphs(t.bio);
          const cut = overflowing ? overflowing.has(String(t.id)) : isLong(paras);
          return (
            <div className="leader-card" key={t.id}>
              <div className="leader-photo">
                <Photo member={t} />
                <div className="leader-photo-overlay"></div>
              </div>
              <div className="leader-info">
                <div className="leader-name">{t.name}</div>
                <div className="leader-role">{t.role_title}</div>
                {paras.length ? (
                  <div className={'leader-bio is-clamped' + (cut ? ' is-cut' : '')} data-id={t.id}>
                    {paras.map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                ) : null}
                {cut ? (
                  <button type="button" className="leader-more" onClick={() => setOpenId(t.id)} aria-haspopup="dialog">
                    Read more →
                  </button>
                ) : null}
                <Links links={t.links} />
              </div>
            </div>
          );
        })}
      </div>
      )}

      {compact && members.length > 6 ? (
        <div className={'leader-toggle-row' + (members.length <= 12 ? ' phone-only' : '')}>
          <button type="button" className="btn btn-secondary leader-toggle" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
            {showAll ? 'Show fewer' : `Show all ${members.length}`}
          </button>
        </div>
      ) : null}

      {open ? (
        <div className="leader-modal-backdrop" onClick={() => setOpenId(null)}>
          <div className="leader-modal" role="dialog" aria-modal="true" aria-labelledby="leader-modal-name" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="leader-modal-close" onClick={() => setOpenId(null)} aria-label="Close" ref={closeRef}>×</button>
            <div className="leader-modal-head">
              <div className="leader-modal-photo"><Photo member={open} /></div>
              <div>
                <h3 className="leader-modal-name" id="leader-modal-name">{open.name}</h3>
                <div className="leader-role">{open.role_title}</div>
                <Links links={open.links} />
              </div>
            </div>
            <div className="leader-modal-bio">
              {bioParagraphs(open.bio).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
