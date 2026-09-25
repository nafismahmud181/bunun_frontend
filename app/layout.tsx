import type { Metadata } from 'next';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import './globals.css';
import CartProvider from '@/components/CartProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getCategories, getStoreSettings } from '@/lib/catalogue';
import type { Category, StoreSettings } from '@/lib/types';

// Used only if the API can't be reached, so the header and cart still render.
const FALLBACK_SETTINGS: StoreSettings = { freeDeliveryThreshold: 3000, hotline: '09612-345678', zones: [] };

export const metadata: Metadata = {
  title: { default: 'Bunon — Handcrafted Home Décor in Bangladesh', template: '%s | Bunon' },
  description:
    'Nakshi kantha table runners, cushion covers, jute décor and home textiles. Cash on Delivery across Bangladesh.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Every page reads the catalogue at request time (cached for 60s), so builds never need the API.
  await connection();
  // If the API is down, the header and footer still render without category links;
  // the page itself shows app/error.tsx.
  const [categories, settings] = await Promise.all([
    getCategories().catch((): Category[] => []),
    getStoreSettings().catch(() => FALLBACK_SETTINGS),
  ]);
  return (
    <html lang="en">
      <body>
        <CartProvider settings={settings}>
          <Header categories={categories} />
          <main>{children}</main>
          <Footer categories={categories} />
        </CartProvider>
      </body>
    </html>
  );
}
