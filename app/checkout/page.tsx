import type { Metadata } from 'next';
import CheckoutForm from '@/components/CheckoutForm';
import { getLocations } from '@/lib/catalogue';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };

export default async function CheckoutPage() {
  return <CheckoutForm locations={await getLocations()} />;
}
