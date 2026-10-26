import type { Metadata } from 'next';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import './globals.css';
import CartProvider from '@/components/CartProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getCategories, getContent, getStoreSettings } from '@/lib/catalogue';
import { themeCss } from '@/lib/theme';
import type { Category, StoreSettings } from '@/lib/types';

// Used only if the API can't be reached, so the header and cart still render.
const FALLBACK_SETTINGS: StoreSettings = {
  freeDeliveryThreshold: 3000,
  hotline: '09612-345678',
  zones: [],
  store: { name: 'BGD Mart', address: '', email: '', tradeLicence: '' },
};

export const metadata: Metadata = {
  title: { default: 'BGD Mart — Handcrafted Home Décor in Bangladesh', template: '%s | BGD Mart' },
  description:
    'Nakshi kantha table runners, cushion covers, jute décor and home textiles. Cash on Delivery across Bangladesh.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Every page reads the catalogue at request time (cached for 60s), so builds never need the API.
  await connection();
  // If the API is down, the header and footer still render without category links;
  // the page itself shows app/error.tsx.
  const [categories, settings, theme] = await Promise.all([
    getCategories().catch((): Category[] => []),
    getStoreSettings().catch(() => FALLBACK_SETTINGS),
    // The palette saved in the admin; null (or the API down) keeps the colours in globals.css.
    getContent()
      .then((c) => c.theme)
      .catch(() => null),
  ]);
  return (
    <html lang="en">
      <head>{theme && <style>{themeCss(theme)}</style>}</head>
      {/* Browser extensions (e.g. ColorZilla) add attributes to <body> before React loads. */}
      <body suppressHydrationWarning>
        <CartProvider settings={settings}>
          <Header categories={categories} />
          <main>{children}</main>
          <Footer categories={categories} />
        </CartProvider>
      </body>
    </html>
  );
}
