'use client';

import { useEffect, useState } from 'react';

const calc = (end) => {
  const s = Math.max(0, Math.floor((new Date(end) - Date.now()) / 1000));
  return { Days: Math.floor(s / 86400), Hours: Math.floor((s % 86400) / 3600), Mins: Math.floor((s % 3600) / 60), Secs: s % 60 };
};

export default function Countdown({ end }) {
  const [t, setT] = useState(null);
  useEffect(() => {
    setT(calc(end));
    const id = setInterval(() => setT(calc(end)), 1000);
    return () => clearInterval(id);
  }, [end]);

  return (
    <div className="countdown">
      <span className="countdown-label">Ends in</span>
      {['Days', 'Hours', 'Mins', 'Secs'].map((k) => (
        <div className="cd-box" key={k}>
          <b>{t ? String(t[k]).padStart(2, '0') : '00'}</b>
          <small>{k}</small>
        </div>
      ))}
    </div>
  );
}
