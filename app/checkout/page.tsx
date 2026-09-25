'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { STORE as S } from '@/lib/store';
import { fmt } from '@/lib/utils';
import { useCart } from '@/components/CartProvider';
import type { DeliveryArea, Order, PaymentMethod } from '@/lib/types';

const PAYMENTS: [PaymentMethod, string, string][] = [
  ['cod', 'Cash on Delivery', 'Pay when you receive the product'],
  ['bkash', 'bKash', 'Pay instantly with your bKash account'],
  ['nagad', 'Nagad', 'Pay instantly with your Nagad account'],
  ['card', 'Debit / Credit Card', 'Visa, Mastercard, Amex via SSLCommerz'],
];

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotal, clear, saveOrder } = useCart();
  const [form, setForm] = useState<{ name: string; phone: string; area: DeliveryArea; address: string }>({
    name: '',
    phone: '',
    area: 'dhaka',
    address: '',
  });
  const [pay, setPay] = useState<PaymentMethod>('cod');
  const [error, setError] = useState('');

  const delivery = subtotal >= S.freeShipAt || subtotal === 0 ? 0 : S.delivery[form.area];
  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!lines.length) return setError('Your cart is empty.');
    if (!form.name.trim() || !/^01\d{9}$/.test(form.phone.trim()) || !form.address.trim())
      return setError('Please enter your name, a valid 11-digit mobile number and address.');

    const order: Order = {
      no: 'BN' + Math.floor(100000 + Math.random() * 899999),
      ...form,
      phone: form.phone.trim(),
      payment: pay,
      items: lines.map((l) => ({ id: l.id, name: l.p.name, size: l.sizeLabel, qty: l.qty, total: l.total })),
      subtotal,
      delivery,
      total: subtotal + delivery,
    };
    // TODO: POST `order` to your backend (e.g. /api/orders) or start bKash / Nagad / SSLCommerz payment here.
    saveOrder(order);
    clear();
    setError('');
    router.push('/order-success');
  };

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
              inputMode="numeric"
              autoComplete="tel"
              value={form.phone}
              onChange={set('phone')}
            />
            <select className="input" value={form.area} onChange={set('area')}>
              <option value="dhaka">Inside Dhaka City (৳{S.delivery.dhaka})</option>
              <option value="outside">Outside Dhaka (৳{S.delivery.outside})</option>
            </select>
            <input
              className="input"
              placeholder="Full address (house, road, area, district)"
              autoComplete="street-address"
              value={form.address}
              onChange={set('address')}
            />
          </div>
          <div className="panel">
            <h2>2. Payment Method</h2>
            {PAYMENTS.map(([id, label, sub]) => (
              <button
                type="button"
                key={id}
                className={`pay-opt ${pay === id ? 'active' : ''}`}
                onClick={() => setPay(id)}
              >
                <span className="radio" />
                <span>
                  <b>{label}</b>
                  <small>{sub}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="panel summary">
          <h2>Order Summary</h2>
          {lines.length === 0 && <div className="muted">Your cart is empty.</div>}
          {lines.map((l) => (
            <div className="sum-line" key={l.key}>
              <span>
                {l.p.name} · {l.sizeLabel} × {l.qty}
              </span>
              <b style={{ whiteSpace: 'nowrap' }}>৳{fmt(l.total)}</b>
            </div>
          ))}
          <div className="sum-total">
            <div className="sum-line">
              <span>Subtotal</span>
              <span>৳{fmt(subtotal)}</span>
            </div>
            <div className="sum-line">
              <span>Delivery charge</span>
              <span>{delivery === 0 ? 'Free' : '৳' + delivery}</span>
            </div>
            <div className="sum-line grand">
              <span>Total</span>
              <span>৳{fmt(subtotal + delivery)}</span>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" style={{ height: 50, padding: 0 }}>
            Place Order
          </button>
          {error && <div className="error">{error}</div>}
        </div>
      </form>
    </section>
  );
}
