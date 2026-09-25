'use client';

import Link from 'next/link';
import { useCart } from '@/components/CartProvider';

export default function OrderSuccessPage() {
  const { lastOrder } = useCart();
  return (
    <section className="done">
      <span className="done-mark">✓</span>
      <h1>Thank you, your order is confirmed</h1>
      <p>
        Order #{lastOrder?.no || '—'} · We&apos;ll call {lastOrder?.phone || 'you'} to confirm before dispatch.
        You&apos;ll receive SMS updates on delivery.
      </p>
      <Link className="btn btn-primary" href="/shop" style={{ marginTop: 8 }}>Continue Shopping</Link>
    </section>
  );
}
