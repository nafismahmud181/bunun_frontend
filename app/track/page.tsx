import type { Metadata } from 'next';
import { Suspense } from 'react';
import TrackOrder from '@/components/TrackOrder';

export const metadata: Metadata = { title: 'Track Your Order', robots: { index: false } };

export default function TrackPage() {
  return (
    <Suspense>
      <TrackOrder />
    </Suspense>
  );
}
