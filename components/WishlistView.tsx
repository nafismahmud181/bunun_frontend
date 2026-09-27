'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import type { ProductSummary } from '@/lib/types';
import { useWishlist } from '@/lib/wishlist';
import ProductCard from './ProductCard';

/** Products saved in this browser, fetched fresh so prices and stock are current. */
export default function WishlistView() {
  const { slugs, remove } = useWishlist();
  const [products, setProducts] = useState<ProductSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const key = slugs.join(',');

  useEffect(() => {
    if (!key) return;
    let stale = false;
    api
      .GET('/api/v1/products', { params: { query: { slugs: key, limit: 50 } } })
      .then(({ data }) => {
        if (stale) return;
        if (data) setProducts(data.items);
        else setFailed(true);
      })
      .catch(() => !stale && setFailed(true));
    return () => {
      stale = true;
    };
  }, [key]);

  if (!key)
    return (
      <div className="empty-state">
        <p>Your wishlist is empty. Tap the heart on any product to save it here.</p>
        <Link className="btn btn-primary" href="/shop">
          Browse products
        </Link>
      </div>
    );
  if (failed) return <p className="error">Could not load your wishlist. Please refresh the page.</p>;
  if (!products) return <p className="muted">Loading…</p>;

  // Keep the saved order (newest first); products no longer on sale are listed so they can be removed.
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const gone = slugs.filter((s) => !bySlug.has(s));
  return (
    <>
      <div className="grid-products">
        {slugs.flatMap((s) => {
          const p = bySlug.get(s);
          return p ? [<ProductCard key={s} p={p} />] : [];
        })}
      </div>
      {gone.length > 0 && (
        <p className="muted" style={{ marginTop: 24 }}>
          {gone.length === 1 ? 'One saved product is' : `${gone.length} saved products are`} no longer available.{' '}
          <button className="link-btn" onClick={() => gone.forEach(remove)}>
            Remove {gone.length === 1 ? 'it' : 'them'}
          </button>
        </p>
      )}
    </>
  );
}
