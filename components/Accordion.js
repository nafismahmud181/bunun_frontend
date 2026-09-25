'use client';

import { useState } from 'react';

export default function Accordion({ items, defaultOpen = 0 }) {
  const [openIdx, setOpenIdx] = useState(defaultOpen);
  return (
    <div className="accordion">
      {items.map(([q, a], i) => (
        <div className="acc-item" key={q}>
          <button className="acc-head" onClick={() => setOpenIdx(openIdx === i ? -1 : i)} aria-expanded={openIdx === i}>
            <span>{q}</span>
            <span>{openIdx === i ? '−' : '+'}</span>
          </button>
          {openIdx === i && <p className="acc-body">{a}</p>}
        </div>
      ))}
    </div>
  );
}
