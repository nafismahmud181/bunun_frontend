'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api/client';
import type { ProductReviews, PublicReview } from '@/lib/types';
import { imgSrc } from '@/lib/utils';
import Stars from './Stars';

const date = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

function ReviewItem({ r }: { r: PublicReview }) {
  return (
    <li className="pr-item">
      <div className="pr-item-head">
        <Stars rating={r.rating} />
        <b>{r.name}</b>
        <small>
          {r.city ? `${r.city} · ` : ''}Verified buyer · {date(r.createdAt)}
        </small>
      </div>
      <p>{r.body}</p>
      {r.images.length > 0 && (
        <div className="pr-photos">
          {r.images.map((url, i) => (
            <a key={url} href={imgSrc(url, 1200)} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc(url, 400)} alt={`Photo ${i + 1} from ${r.name}`} loading="lazy" />
            </a>
          ))}
        </div>
      )}
    </li>
  );
}

/** Star breakdown and approved reviews, with "show more" loading further pages from the API. */
export default function ProductReviewsSection({ slug, initial }: { slug: string; initial: ProductReviews }) {
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [loading, setLoading] = useState(false);
  const { summary } = initial;
  const more = items.length < initial.total;

  const loadMore = async () => {
    setLoading(true);
    const { data } = await api
      .GET('/api/v1/products/{slug}/reviews', {
        params: { path: { slug }, query: { page: page + 1, limit: initial.limit } },
      })
      .catch(() => ({ data: undefined }));
    if (data) {
      setItems((prev) => [...prev, ...data.items.filter((r) => !prev.some((p) => p.id === r.id))]);
      setPage(data.page);
    }
    setLoading(false);
  };

  return (
    <section className="pr" id="reviews">
      <div className="section-head">
        <h2 className="h2">Customer Reviews</h2>
        <Link className="btn btn-outline" href={`/review?product=${encodeURIComponent(slug)}`}>
          Write a review
        </Link>
      </div>
      {summary.count === 0 ? (
        <p className="muted">
          No reviews yet. Bought this?{' '}
          <Link href={`/review?product=${encodeURIComponent(slug)}`}>Be the first to review it.</Link>
        </p>
      ) : (
        <div className="pr-grid">
          <div className="pr-summary">
            <strong>{summary.average?.toFixed(1)}</strong>
            <Stars rating={summary.average ?? 0} size={18} />
            <small>
              {summary.count} review{summary.count === 1 ? '' : 's'}
            </small>
            <ul className="pr-bars">
              {(['5', '4', '3', '2', '1'] as const).map((s) => {
                const n = summary.breakdown[s];
                return (
                  <li key={s}>
                    <span>{s} ★</span>
                    <span className="pr-bar" aria-hidden="true">
                      <span style={{ width: `${(n / summary.count) * 100}%` }} />
                    </span>
                    <span className="pr-n">{n}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <ul className="pr-list">
              {items.map((r) => (
                <ReviewItem key={r.id} r={r} />
              ))}
            </ul>
            {more && (
              <button className="btn btn-outline" onClick={loadMore} disabled={loading}>
                {loading ? 'Loading…' : 'Show more reviews'}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
