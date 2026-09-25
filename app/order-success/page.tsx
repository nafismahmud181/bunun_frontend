'use client';

import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { fmt } from '@/lib/utils';

export default function OrderSuccessPage() {
  const { lastOrder } = useCart();
  const trackHref = lastOrder
    ? `/track?order=${encodeURIComponent(lastOrder.orderNo)}&phone=${encodeURIComponent(lastOrder.phone)}`
    : '/track';
  return (
    <section className="done">
      <span className="done-mark">✓</span>
      <h1>Thank you, we&apos;ve received your order</h1>
      <p>
        Order #{lastOrder?.orderNo || '—'}
        {lastOrder && <> · ৳{fmt(lastOrder.total)} Cash on Delivery</>} · We&apos;ll call {lastOrder?.phone || 'you'} to
        confirm before dispatch. You&apos;ll receive SMS updates on delivery.
      </p>
      <Link className="btn btn-primary" href="/shop" style={{ marginTop: 8 }}>
        Continue Shopping
      </Link>
      <Link href={trackHref} style={{ marginTop: 8 }}>
        Track this order
      </Link>
    </section>
  );
}
