'use client';

import { useMemo, useState } from 'react';

export default function SermonGrid({ sermons }) {
  const series = useMemo(() => {
    const set = new Set();
    sermons.forEach((s) => { if (s.series) set.add(s.series); });
    return Array.from(set);
  }, [sermons]);

  const [active, setActive] = useState('all');
  const [query, setQuery] = useState('');
  const filtered = sermons.filter((s) => {
    const inSeries = active === 'all' || s.series === active;
    const haystack = [s.title, s.series, s.speaker, s.description].filter(Boolean).join(' ').toLowerCase();
    return inSeries && haystack.includes(query.trim().toLowerCase());
  });

  return (
    <>
      <label className="sermon-search">
        <span className="sr-only">Search messages</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" className="form-input" placeholder="Search messages..." />
      </label>
      <div className="series-tabs" aria-label="Filter messages by series">
        <button type="button" className={'series-tab' + (active === 'all' ? ' active' : '')} aria-pressed={active === 'all'} onClick={() => setActive('all')}>All</button>
        {series.map((s) => (
          <button type="button" key={s} className={'series-tab' + (active === s ? ' active' : '')} aria-pressed={active === s} onClick={() => setActive(s)}>{s}</button>
        ))}
      </div>

      <div className="sermon-grid">
        {filtered.length === 0 && (
          <p style={{ color: 'var(--gray-1)', gridColumn: '1/-1' }}>No messages match this search.</p>
        )}
        {filtered.map((s) => (
          <a
            key={s.id}
            className="sermon-card-full"
            href={`https://www.youtube.com/watch?v=${s.youtube_id}`}
            target="_blank"
            rel="noopener"
          >
            <div className="sermon-thumb">
              <img src={s.thumbnail_url || `https://i.ytimg.com/vi/${s.youtube_id}/hqdefault.jpg`} alt={s.title} loading="lazy" />
              <div className="play-overlay">
                <div className="play-circle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 3 }}><polygon points="5 3 19 12 5 21 5 3" /></svg>
                </div>
              </div>
            </div>
            <div className="sermon-body">
              {s.series ? <div className="sermon-series-tag">{s.series}</div> : null}
              <div className="sermon-title">{s.title}</div>
              <div className="sermon-meta">
                {[s.speaker, s.published_at ? new Date(s.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null].filter(Boolean).map((x) => <span key={x}>{x}</span>)}
              </div>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
