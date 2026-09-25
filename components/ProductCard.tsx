'use client';

import Link from 'next/link';
import { bg, fmt, imgSrc, productHref } from '@/lib/utils';
import type { ProductSummary } from '@/lib/types';
import { useCart } from './CartProvider';

export default function ProductCard({ p, forceNew = false }: { p: ProductSummary; forceNew?: boolean }) {
  const { add, showToast } = useCart();
  const tag = forceNew ? 'New' : p.tag;
  const href = productHref(p.slug);
  const first = p.firstVariant;
  const image = p.image ? imgSrc(p.image.url) : null;
  return (
    <div className="card">
      <Link className="card-img" href={href} style={image ? bg(image) : undefined} aria-label={p.name}>
        {tag && <span className={`badge ${tag === 'Sale' ? 'sale' : ''}`}>{tag}</span>}
      </Link>
      <div className="card-body">
        <span className="card-cat">{p.category.name}</span>
        <Link className="card-name" href={href}>
          {p.name}
        </Link>
        <div className="price-row">
          <span className="price">৳{fmt(p.price)}</span>
          {p.compareAtPrice && <span className="was">৳{fmt(p.compareAtPrice)}</span>}
        </div>
        <button
          className="add-btn"
          disabled={!first || first.stockStatus === 'out'}
          onClick={() => {
            if (!first) return;
            add(first.sku, 1, { slug: p.slug, name: p.name, label: first.label, price: first.price, image });
            showToast(p.name + ' added to cart');
          }}
        >
          {first && first.stockStatus !== 'out' ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
