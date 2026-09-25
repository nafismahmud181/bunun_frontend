'use client';

import { useSyncExternalStore } from 'react';

type Remaining = Record<'Days' | 'Hours' | 'Mins' | 'Secs', number>;

const calc = (end: string, nowSec: number): Remaining => {
  const s = Math.max(0, Math.floor(new Date(end).getTime() / 1000) - nowSec);
  return {
    Days: Math.floor(s / 86400),
    Hours: Math.floor((s % 86400) / 3600),
    Mins: Math.floor((s % 3600) / 60),
    Secs: s % 60,
  };
};

// A clock that ticks every second. The server snapshot is null, so the server and the
// first client render both show 00 and hydration matches.
const subscribe = (tick: () => void) => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
};
const nowSec = () => Math.floor(Date.now() / 1000);
const noClock = () => null;

export default function Countdown({ end }: { end: string }) {
  const now = useSyncExternalStore(subscribe, nowSec, noClock);
  const t = now === null ? null : calc(end, now);

  return (
    <div className="countdown">
      <span className="countdown-label">Ends in</span>
      {(['Days', 'Hours', 'Mins', 'Secs'] as const).map((k) => (
        <div className="cd-box" key={k}>
          <b>{t ? String(t[k]).padStart(2, '0') : '00'}</b>
          <small>{k}</small>
        </div>
      ))}
    </div>
  );
}
