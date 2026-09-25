'use client';

import { useState } from 'react';

export default function Newsletter() {
  const [done, setDone] = useState(false);
  return (
    <div className="newsletter">
      <div>
        <h2>Get 10% off your first order</h2>
        <p>Subscribe for new arrivals, Eid &amp; Puja collections and exclusive offers.</p>
      </div>
      {done ? (
        <div className="success">Thank you! Your code WELCOME10 is on its way.</div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setDone(true); /* TODO: send to your email/SMS provider */
          }}
        >
          <input className="input" required placeholder="Email or mobile number" />
          <button className="btn btn-primary" type="submit">
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
