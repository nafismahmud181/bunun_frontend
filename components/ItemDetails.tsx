'use client';

import { useEffect, useRef, useState } from 'react';

// "Item details" on the product page, Etsy-style: open by default, long descriptions fade out
// after a few lines with "Learn more about this item" to show the rest.

const BULLET = /^\s*[-*•]\s+/;

/** Paragraphs from plain text; lines starting with -, * or • become bullet points. */
function blocks(text: string) {
  const out: ({ kind: 'p'; text: string } | { kind: 'ul'; items: string[] })[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const last = out[out.length - 1];
    if (BULLET.test(line)) {
      const item = line.replace(BULLET, '');
      if (last?.kind === 'ul') last.items.push(item);
      else out.push({ kind: 'ul', items: [item] });
    } else out.push({ kind: 'p', text: line.trim() });
  }
  return out;
}

export default function ItemDetails({ text }: { text: string }) {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [long, setLong] = useState(false);
  const body = useRef<HTMLDivElement>(null);

  // Only offer "Learn more" when the text is taller than the collapsed height.
  useEffect(() => {
    const el = body.current;
    if (!el || expanded) return;
    const measure = () => setLong(el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded, open, text]);

  return (
    <div className="item-details">
      <button className="id-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>Item details</span>
        <svg className={`id-chevron ${open ? 'open' : ''}`} viewBox="0 0 24 24" width="20" height="20" aria-hidden>
          <path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <>
          <div ref={body} className={`id-body ${expanded ? '' : 'clamped'} ${long && !expanded ? 'faded' : ''}`}>
            {blocks(text).map((b, i) =>
              b.kind === 'p' ? (
                <p key={i}>{b.text}</p>
              ) : (
                <ul key={i}>
                  {b.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              ),
            )}
          </div>
          {(long || expanded) && (
            <button className="id-more" onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Show less' : 'Learn more about this item'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
