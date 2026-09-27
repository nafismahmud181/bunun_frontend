'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { fmt } from '@/lib/utils';
import type { LocationTree, Quote } from '@/lib/types';
import { useCart } from './CartProvider';

// Same rule as the backend: 01XXXXXXXXX, optionally written with +88 / 88, spaces or dashes.
const normalisePhone = (s: string) => s.replace(/[\s-]/g, '').replace(/^\+?88(?=01)/, '');
const isPhone = (s: string) => /^01[3-9]\d{8}$/.test(normalisePhone(s));

type Form = {
  name: string;
  phone: string;
  divisionId: string;
  districtId: string;
  areaId: string;
  address: string;
  notes: string;
};

export default function CheckoutForm({ locations }: { locations: LocationTree }) {
  const router = useRouter();
  const { lines, subtotal, token, reload, saveOrder, settings } = useCart();
  const [form, setForm] = useState<Form>({
    name: '',
    phone: '',
    divisionId: '',
    districtId: '',
    areaId: '',
    address: '',
    notes: '',
  });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [couponInput, setCouponInput] = useState('');
  // The code the shopper applied; the quote says whether it is valid and what it takes off.
  const [coupon, setCoupon] = useState('');
  const [quoteVersion, setQuoteVersion] = useState(0);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  // One key per order attempt: a retry after a network error reuses it, so the order can't be placed twice.
  const idempotencyKey = useRef<string | null>(null);

  const division = useMemo(() => locations.find((d) => String(d.id) === form.divisionId), [locations, form.divisionId]);
  const district = useMemo(
    () => division?.districts.find((d) => String(d.id) === form.districtId),
    [division, form.districtId],
  );

  // Delivery fee, coupon discount and total always come from the server, for the chosen area,
  // coupon and current cart. With a valid phone number the coupon's per-phone rules are checked too.
  const phoneForQuote = isPhone(form.phone) ? normalisePhone(form.phone) : '';
  useEffect(() => {
    if (!token || (!form.areaId && !coupon)) return;
    let stale = false;
    api
      .GET('/api/v1/cart/quote', {
        params: {
          query: {
            ...(form.areaId && { areaId: Number(form.areaId) }),
            ...(coupon && { coupon }),
            ...(coupon && phoneForQuote && { phone: phoneForQuote }),
          },
        },
        headers: { 'x-cart-token': token },
      })
      .then(({ data }) => !stale && setQuote(data ?? null))
      .catch(() => {});
    return () => {
      stale = true;
    };
  }, [form.areaId, token, subtotal, coupon, phoneForQuote, quoteVersion]);

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{1,30}$/.test(code)) return setError('Enter the coupon code as written, e.g. EID20.');
    setError('');
    setCoupon(code);
  };
  const removeCoupon = () => {
    setCoupon('');
    setCouponInput('');
    if (!form.areaId) setQuote(null);
  };
  const couponOk = !!coupon && quote?.coupon?.code === coupon;
  const couponError = coupon ? quote?.couponError : undefined;

  const set = (k: keyof Form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const v = e.target.value;
    setForm((f) => ({
      ...f,
      [k]: v,
      // Changing a level clears the levels below it.
      ...(k === 'divisionId' && { districtId: '', areaId: '' }),
      ...(k === 'districtId' && { areaId: '' }),
    }));
    if (k === 'divisionId' || k === 'districtId') setQuote(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!lines.length || !token) return setError('Your cart is empty.');
    if (lines.some((l) => !l.available))
      return setError('Some items have fewer in stock than in your cart. Please update your cart.');
    if (form.name.trim().length < 2 || !isPhone(form.phone) || !form.areaId || form.address.trim().length < 5)
      return setError('Please enter your name, a valid 11-digit mobile number, your area and full address.');
    if (coupon && !couponOk)
      return setError(`${couponError ?? 'Checking your coupon…'} Remove the coupon to order without it.`);

    setError('');
    setPlacing(true);
    idempotencyKey.current ??= crypto.randomUUID();
    try {
      const { data, error: err } = await api.POST('/api/v1/checkout', {
        params: { header: { 'x-cart-token': token, 'idempotency-key': idempotencyKey.current } },
        body: {
          name: form.name.trim(),
          phone: form.phone,
          areaId: Number(form.areaId),
          address: form.address.trim(),
          ...(form.notes.trim() && { notes: form.notes.trim() }),
          ...(couponOk && { coupon }),
          paymentMethod: 'cod',
        },
      });
      if (data) {
        idempotencyKey.current = null;
        saveOrder({ orderNo: data.orderNo, phone: data.phone, total: data.total });
        await reload();
        router.push('/order-success');
        return;
      }
      if (err && 'code' in err && (err.code === 'OUT_OF_STOCK' || err.code === 'UNAVAILABLE')) await reload();
      if (err && 'code' in err && err.code === 'COUPON_INVALID') setQuoteVersion((v) => v + 1);
      setError(err && 'code' in err ? err.message : 'Please check your details and try again.');
    } catch {
      setError('Could not reach the store. Please check your connection and try again.');
    } finally {
      setPlacing(false);
    }
  };

  const deliveryFee = quote?.deliveryFee ?? undefined;
  const total = quote ? quote.total : subtotal;
  return (
    <section className="checkout">
      <h1 className="page-title" style={{ marginBottom: 24 }}>
        Checkout
      </h1>
      <form className="checkout-grid" onSubmit={submit} noValidate>
        <div className="stack">
          <div className="panel">
            <h2>1. Delivery Information</h2>
            <input
              className="input"
              placeholder="Full name"
              autoComplete="name"
              value={form.name}
              onChange={set('name')}
            />
            <input
              className="input"
              placeholder="Mobile number (01XXXXXXXXX)"
              inputMode="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={set('phone')}
            />
            <div className="address-row">
              <select className="input" aria-label="Division" value={form.divisionId} onChange={set('divisionId')}>
                <option value="">Division</option>
                {locations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                className="input"
                aria-label="District"
                value={form.districtId}
                onChange={set('districtId')}
                disabled={!division}
              >
                <option value="">District</option>
                {division?.districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                className="input"
                aria-label="Area / thana"
                value={form.areaId}
                onChange={set('areaId')}
                disabled={!district}
              >
                <option value="">Area / thana</option>
                {district?.areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <input
              className="input"
              placeholder="House, road, block / village"
              autoComplete="street-address"
              value={form.address}
              onChange={set('address')}
            />
            <textarea
              className="input"
              placeholder="Delivery notes (optional)"
              rows={2}
              maxLength={500}
              value={form.notes}
              onChange={set('notes')}
            />
          </div>
          <div className="panel">
            <h2>2. Payment Method</h2>
            <div className="pay-opt active">
              <span className="radio" />
              <span>
                <b>Cash on Delivery</b>
                <small>Pay when you receive the product. We&apos;ll call to confirm your order.</small>
              </span>
            </div>
          </div>
        </div>
        <div className="panel summary">
          <h2>Order Summary</h2>
          {lines.length === 0 && <div className="muted">Your cart is empty.</div>}
          {lines.map((l) => (
            <div className="sum-line" key={l.sku}>
              <span>
                {l.name} · {l.label} × {l.qty}
                {!l.available && <small className="line-warn"> (only {l.stockLeft ?? 0} left)</small>}
              </span>
              <b style={{ whiteSpace: 'nowrap' }}>৳{fmt(l.lineTotal)}</b>
            </div>
          ))}
          <div className="coupon">
            {couponOk ? (
              <div className="coupon-applied">
                <span>
                  <b>{coupon}</b> · {quote?.coupon?.summary}
                  {quote?.coupon?.description && <small>{quote.coupon.description}</small>}
                </span>
                <button type="button" className="link-btn" onClick={removeCoupon}>
                  Remove
                </button>
              </div>
            ) : (
              <div className="coupon-row">
                <input
                  className="input"
                  placeholder="Coupon code"
                  aria-label="Coupon code"
                  autoCapitalize="characters"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyCoupon();
                    }
                  }}
                />
                <button type="button" className="btn btn-outline" onClick={applyCoupon} disabled={!couponInput.trim()}>
                  Apply
                </button>
              </div>
            )}
            {couponError && (
              <div className="coupon-error" role="alert">
                {couponError}{' '}
                <button type="button" className="link-btn" onClick={removeCoupon}>
                  Remove
                </button>
              </div>
            )}
          </div>
          <div className="sum-total">
            <div className="sum-line">
              <span>Subtotal</span>
              <span>৳{fmt(subtotal)}</span>
            </div>
            {couponOk && quote && quote.discount > 0 && (
              <div className="sum-line discount">
                <span>Coupon {coupon}</span>
                <span>−৳{fmt(quote.discount)}</span>
              </div>
            )}
            <div className="sum-line">
              <span>Delivery charge</span>
              <span>
                {deliveryFee === undefined
                  ? subtotal >= settings.freeDeliveryThreshold
                    ? 'Free'
                    : 'Choose your area'
                  : deliveryFee === 0
                    ? 'Free'
                    : '৳' + fmt(deliveryFee)}
              </span>
            </div>
            {quote?.zone && (
              <div className="sum-line muted">
                <span>{quote.zone.name}</span>
                <span>{quote.zone.estimate}</span>
              </div>
            )}
            <div className="sum-line grand">
              <span>Total</span>
              <span>৳{fmt(total)}</span>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={placing} style={{ height: 50, padding: 0 }}>
            {placing ? 'Placing order…' : 'Place Order'}
          </button>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
        </div>
      </form>
    </section>
  );
}
