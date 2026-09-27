'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { API_URL, api } from '@/lib/api/client';
import type { ReviewableOrder } from '@/lib/types';
import { bg, imgSrc, productHref } from '@/lib/utils';

const MAX_PHOTOS = 3;
const MAX_BYTES = 10 * 1024 * 1024;
const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

type Item = ReviewableOrder['items'][number];

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="star-picker" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}: ${RATING_WORDS[n]}`}
          className={n <= value ? 'on' : ''}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
      <span className="muted">{RATING_WORDS[value] || 'Tap to rate'}</span>
    </div>
  );
}

function ReviewForm({
  item,
  orderNo,
  phone,
  suggestedName,
  onDone,
}: {
  item: Item;
  orderNo: string;
  phone: string;
  suggestedName: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState(suggestedName);
  const [body, setBody] = useState('');
  // Each photo with a preview URL, created when it is added and released when it is removed.
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const created = useRef(new Set<string>());
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const urls = created.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);
  const preview = (file: File) => {
    const url = URL.createObjectURL(file);
    created.current.add(url);
    return { file, url };
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const chosen = [...files].filter((f) => f.type.startsWith('image/'));
    if (chosen.some((f) => f.size > MAX_BYTES)) setError('Each photo must be 10 MB or smaller.');
    const room = MAX_PHOTOS - photos.length;
    const ok = chosen.filter((f) => f.size <= MAX_BYTES);
    if (ok.length > room) setError(`You can add up to ${MAX_PHOTOS} photos.`);
    setPhotos([...photos, ...ok.slice(0, room).map(preview)]);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rating) return setError('Please choose a star rating.');
    if (name.trim().length < 2) return setError('Please enter the name to show with your review.');
    if (body.trim().length < 10) return setError('Please write at least a sentence.');
    setError('');
    setSending(true);
    const form = new FormData();
    form.append('orderNo', orderNo);
    form.append('phone', phone);
    form.append('slug', item.slug);
    form.append('rating', String(rating));
    form.append('name', name.trim());
    form.append('body', body.trim());
    for (const p of photos) form.append('photo', p.file, p.file.name);
    try {
      const res = await fetch(`${API_URL}/api/v1/reviews`, { method: 'POST', body: form });
      if (res.status === 201) return onDone();
      const err = (await res.json().catch(() => null)) as { message?: string } | null;
      setError(err?.message ?? 'Could not send your review. Please try again.');
    } catch {
      setError('Could not reach the store. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="review-form" onSubmit={submit} noValidate>
      <StarPicker value={rating} onChange={setRating} />
      <label>
        <span>Your review</span>
        <textarea
          className="input"
          rows={4}
          maxLength={2000}
          placeholder="What did you like? How is the quality, size and colour?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>
      <label>
        <span>Name shown with your review</span>
        <input className="input" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="review-photos">
        {photos.map((p, i) => (
          <div key={p.url} className="review-photo" style={bg(p.url)}>
            <button
              type="button"
              aria-label={`Remove photo ${i + 1}`}
              onClick={() => {
                URL.revokeObjectURL(p.url);
                created.current.delete(p.url);
                setPhotos(photos.filter((_, j) => j !== i));
              }}
            >
              ×
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <label className="review-photo add">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                addPhotos(e.target.files);
                e.target.value = '';
              }}
            />
            <span>+ Photo</span>
          </label>
        )}
      </div>
      <small className="muted">
        Up to {MAX_PHOTOS} photos of the product. Please don&apos;t include people&apos;s faces or addresses.
      </small>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <button className="btn btn-primary" type="submit" disabled={sending}>
        {sending ? 'Sending…' : 'Send review'}
      </button>
    </form>
  );
}

export default function ReviewFlow() {
  const sp = useSearchParams();
  const wanted = sp.get('product');
  const [orderNo, setOrderNo] = useState(sp.get('order') ?? '');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<ReviewableOrder | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [thanks, setThanks] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const lookUp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await api.POST('/api/v1/reviews/lookup', {
        body: { orderNo: orderNo.trim(), phone: phone.trim() },
      });
      if (data) {
        setOrder(data);
        const first = data.items.find((i) => !i.reviewed && (!wanted || i.slug === wanted));
        setOpen(first?.slug ?? null);
      } else
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
  };

  return (
    <section className="container track">
      <h1 className="page-title">Review Your Order</h1>
      {!order ? (
        <>
          <p className="muted" style={{ marginTop: -8 }}>
            Reviews come from customers whose order has been delivered. Enter your order details to start.
          </p>
          <form className="track-form" onSubmit={lookUp}>
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
              {loading ? 'Checking…' : 'Continue'}
            </button>
          </form>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
        </>
      ) : (
        <div className="review-items">
          <p className="muted">
            Order {order.orderNo}. Your review appears on the product page once we&apos;ve checked it, usually within a
            day.
          </p>
          {order.items.length === 0 && <p>There&apos;s nothing in this order that can be reviewed any more.</p>}
          {order.items.map((i) => {
            const done = i.reviewed || thanks.includes(i.slug);
            return (
              <div key={i.slug} className="panel review-item">
                <div className="review-item-head">
                  <div className="review-thumb" style={i.image ? bg(imgSrc(i.image.url, 400)) : undefined} />
                  <div>
                    <Link href={productHref(i.slug)}>
                      <b>{i.name}</b>
                    </Link>
                    <small>{i.label}</small>
                  </div>
                  {done ? (
                    <span className="review-done">
                      {thanks.includes(i.slug) ? 'Thank you! Review sent' : 'Already reviewed'}
                    </span>
                  ) : (
                    open !== i.slug && (
                      <button className="btn btn-outline" onClick={() => setOpen(i.slug)}>
                        Write a review
                      </button>
                    )
                  )}
                </div>
                {!done && open === i.slug && (
                  <ReviewForm
                    item={i}
                    orderNo={order.orderNo}
                    phone={phone.trim()}
                    suggestedName={order.suggestedName}
                    onDone={() => {
                      setThanks((t) => [...t, i.slug]);
                      const next = order.items.find(
                        (x) => x.slug !== i.slug && !x.reviewed && !thanks.includes(x.slug),
                      );
                      setOpen(next?.slug ?? null);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
