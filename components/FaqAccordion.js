'use client';

import { useState } from 'react';

export default function FaqAccordion({ items, defaultOpen = 0 }) {
  const [openIndex, setOpenIndex] = useState(defaultOpen);

  return (
    <div>
      {items.map((item, i) => (
        <div className={'faq-item' + (openIndex === i ? ' open' : '')} key={i}>
          <button type="button" className="faq-q" aria-expanded={openIndex === i} aria-controls={`faq-answer-${i}`} onClick={() => setOpenIndex(openIndex === i ? -1 : i)}>
            {item.q}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          <div id={`faq-answer-${i}`} className="faq-a" hidden={openIndex !== i}>
            {item.a}
          </div>
        </div>
      ))}
    </div>
  );
}
