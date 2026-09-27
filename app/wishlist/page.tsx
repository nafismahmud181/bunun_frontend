import type { Metadata } from 'next';
import WishlistView from '@/components/WishlistView';

export const metadata: Metadata = { title: 'Wishlist', robots: { index: false } };

export default function WishlistPage() {
  return (
    <section className="container section" style={{ paddingBottom: 64 }}>
      <h1 className="page-title">Your Wishlist</h1>
      <p className="muted" style={{ marginTop: -12, marginBottom: 24 }}>
        Saved on this device.
      </p>
      <WishlistView />
    </section>
  );
}
