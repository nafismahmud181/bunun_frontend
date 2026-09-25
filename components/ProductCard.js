'use client';

import Link from 'next/link';
import { bg, fmt, imgOf } from '@/lib/utils';
import { useCart } from './CartProvider';

export default function ProductCard({ p, forceNew = false }) {
  const { add, showToast } = useCart();
  const tag = forceNew ? 'New' : p.tag;
  const href = `/product/${p.id}`;
  return (
    <div className="card">
      <Link className="card-img" href={href} style={bg(imgOf(p))} aria-label={p.name}>
        {tag && <span className={`badge ${tag === 'Sale' ? 'sale' : ''}`}>{tag}</span>}
      </Link>
      <div className="card-body">
        <span className="card-cat">{p.cat}</span>
        <Link className="card-name" href={href}>{p.name}</Link>
        <div className="price-row">
          <span className="price">৳{fmt(p.price)}</span>
          {p.was && <span className="was">৳{fmt(p.was)}</span>}
        </div>
        <button className="add-btn" onClick={() => { add(p.id, 0, 1); showToast(p.name + ' added to cart'); }}>Add to Cart</button>
      </div>
    </div>
  );
}
