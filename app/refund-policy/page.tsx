import type { Metadata } from 'next';
import { connection } from 'next/server';
import LegalPage from '@/components/LegalPage';
import { getPage } from '@/lib/catalogue';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getPage('refund-policy')).title };
}

export default async function Page() {
  await connection();
  return <LegalPage page={await getPage('refund-policy')} />;
}
