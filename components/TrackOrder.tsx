'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { fmt } from '@/lib/utils';
import type { OrderStatus, TrackedOrder } from '@/lib/types';

// Shown in this order; cancelled/returned/refunded appear only if they happened.
const STEPS: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const LABEL: Record<OrderStatus, string> = {
  pending: 'Order received',
  confirmed: 'Confirmed by phone',
  processing: 'Being packed',
  shipped: 'With the courier',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};
const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

// Runs in the browser, so the API's per-visitor rate limit applies to each shopper, not the storefront server.
export default function TrackOrder() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [orderNo, setOrderNo] = useState(sp.get('order') ?? '');
  const [phone, setPhone] = useState(sp.get('phone') ?? '');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const lookUp = useCallback(async (no: string, ph: string) => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await api.GET('/api/v1/orders/track', {
        params: { query: { orderNo: no, phone: ph } },
      });
      setOrder(data ?? null);
      if (!data)
        setError(
          err && 'code' in err && err.code !== 'FST_ERR_VALIDATION'
            ? err.message
            : 'Enter your order number (e.g. BN-2026-000123) and the mobile number you ordered with.',
        );
    } catch {
      setError('Could not reach the store. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Links from the confirmation page and the SMS open with the details filled in.
  useEffect(() => {
    const no = sp.get('order');
    const ph = sp.get('phone');
    if (!no || !ph) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void lookUp(no, ph);
    // Keep the phone number out of the address bar and browser history.
    router.replace(`${pathname}?order=${encodeURIComponent(no)}`, { scroll: false });
  }, [sp, lookUp, router, pathname]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const no = orderNo.trim();
    const ph = phone.trim();
    router.replace(`${pathname}?order=${encodeURIComponent(no)}`, { scroll: false });
    void lookUp(no, ph);
  };

  const reached = new Set(order?.history.map((h) => h.status));
  const at = (s: OrderStatus) => order?.history.find((h) => h.status === s)?.at;
  const extra = order?.history.filter((h) => !STEPS.includes(h.status)) ?? [];

  return (
    <section className="container track">
      <h1 className="page-title">Track Your Order</h1>
      <form className="track-form" onSubmit={submit}>
        <input
          className="input"
          placeholder="Order number, e.g. BN-2026-000123"
          value={orderNo}
          onChange={(e) => setOrderNo(e.target.value)}
          aria-label="Order number"
        />
        <input
          className="input"
          placeholder="Mobile number used for the order"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-label="Mobile number"
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Checking…' : 'Track'}
        </button>
      </form>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {order && (
        <div className="panel track-result">
          <h2>
            Order {order.orderNo} · {LABEL[order.status]}
          </h2>
          <ol className="track-steps">
            {STEPS.map((s) => (
              <li key={s} className={reached.has(s) ? 'is-done' : ''}>
                <b>{LABEL[s]}</b>
                {at(s) && <small>{when(at(s)!)}</small>}
              </li>
            ))}
            {extra.map((h) => (
              <li key={h.status + h.at} className="is-done is-stopped">
                <b>{LABEL[h.status]}</b>
                <small>{when(h.at)}</small>
              </li>
            ))}
          </ol>
          {order.items.map((i) => (
            <div className="sum-line" key={i.sku}>
              <span>
                {i.name} · {i.label} × {i.qty}
              </span>
              <b>৳{fmt(i.lineTotal)}</b>
            </div>
          ))}
          <div className="sum-total">
            <div className="sum-line">
              <span>
                Delivery to {order.area}, {order.district}
              </span>
              <span>{order.deliveryFee === 0 ? 'Free' : '৳' + fmt(order.deliveryFee)}</span>
            </div>
            <div className="sum-line grand">
              <span>Total (Cash on Delivery)</span>
              <span>৳{fmt(order.total)}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
