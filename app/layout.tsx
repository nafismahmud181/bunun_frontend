import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import CartProvider from '@/components/CartProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: { default: 'Bunon — Handcrafted Home Décor in Bangladesh', template: '%s | Bunon' },
  description:
    'Nakshi kantha table runners, cushion covers, jute décor and home textiles. Cash on Delivery across Bangladesh.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
