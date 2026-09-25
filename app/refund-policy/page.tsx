import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = { title: LEGAL.refund.title };

export default function Page() {
  return <LegalPage page={LEGAL.refund} />;
}
