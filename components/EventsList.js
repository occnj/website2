'use client';

import { useState } from 'react';

const CATS = [
  ['all', 'All Events'],
  ['worship', 'Worship'],
  ['women', 'Women'],
  ['youth', 'Youth'],
  ['community', 'Community'],
  ['family', 'Family'],
];

function eventDate(e) {
  return e.starts_at ? new Date(e.starts_at + 'T12:00:00') : null;
}

export default function EventsList({ events }) {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? events : events.filter((e) => (e.category || 'community') === filter);

  let lastMonth = '';

  return (
    <div data-events-list>
      <div className="filter-bar">
        {CATS.map(([key, label]) => (
          <div
            key={key}
            className={'filter-chip' + (filter === key ? ' active' : '')}
            onClick={() => setFilter(key)}
          >
            {label}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: 'var(--gray-1)', padding: '40px 0' }}>No events in this category yet — check back soon.</p>
      )}

      {filtered.map((e) => {
        const d = eventDate(e);
        const monthLabel = d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric' }) : '';
        const showMonthHeading = monthLabel && monthLabel !== lastMonth;
        lastMonth = monthLabel;
        return (
          <div key={e.id}>
            {showMonthHeading && (
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '.75rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--gray-1)', marginBottom: 'var(--sp-2)', marginTop: 'var(--sp-4)' }}>
                {monthLabel}
              </div>
            )}
            <div className="event-full" data-cat={e.category || 'community'}>
              <div className="event-date-col">
                <div className="month">{d ? d.toLocaleString('en-US', { month: 'short' }) : ''}</div>
                <div className="day">{d ? String(d.getDate()).padStart(2, '0') : ''}</div>
                <div className="dow">{d ? d.toLocaleString('en-US', { weekday: 'short' }) : ''}</div>
              </div>
              <div className="event-body">
                <div className="event-cat">{(e.category || 'community').replace(/^\w/, (c) => c.toUpperCase())}</div>
                <div className="event-title">{e.title}</div>
                <div className="event-meta-row">
                  {[e.time_label, e.location].filter(Boolean).map((x) => <span key={x}>{x}</span>)}
                </div>
                {e.description ? <div className="event-desc">{e.description}</div> : null}
              </div>
              {e.registration_url ? (
                <div className="event-action">
                  <a href={e.registration_url} target="_blank" rel="noopener" className="btn btn-secondary btn-sm">Register</a>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
