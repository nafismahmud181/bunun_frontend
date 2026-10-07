'use client';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';

// Shown when a page can't load, e.g. the catalogue API is unreachable.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <section className="done">
      <h1>Something went wrong</h1>
      <p>We couldn&apos;t load this page. Please try again in a moment.</p>
      <button className="btn btn-primary" onClick={reset}>
        Try Again
      </button>
      <Link href="/" style={{ marginTop: 8 }}>
        Back to Home
      </Link>
    </section>
  );
}
