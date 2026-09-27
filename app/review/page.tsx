import type { Metadata } from 'next';
import { Suspense } from 'react';
import ReviewFlow from '@/components/ReviewFlow';

export const metadata: Metadata = { title: 'Review Your Order', robots: { index: false } };

export default function ReviewPage() {
  return (
    <Suspense>
      <ReviewFlow />
    </Suspense>
  );
}
