'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STORE as S } from '@/lib/store';
import { bg, byId, catHref, fmt, imgOf, px, unitPrice } from '@/lib/utils';
import { useCart } from './CartProvider';
import Accordion from './Accordion';
import ProductCard from './ProductCard';

export default function ProductDetail({ id }: { id: string }) {
  const found = byId(id);
  const router = useRouter();
  const { add, setOpen } = useCart();
  const [img, setImg] = useState(0);
  const [size, setSize] = useState(0);
  const [qty, setQty] = useState(1);
  // The page checks the id before rendering this component.
  if (!found) throw new Error(`Unknown product ${id}`);
  const p = found;

  const sizes = S.sizes[p.cat] ?? [];
  const unit = unitPrice(p, size);
  const gallery = [
    p.img,
    ...S.products.filter((x) => x.cat === p.cat && x.id !== p.id).map((x) => x.img),
    S.categoryImages[p.cat] ?? p.img,
  ]
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 4)
    .map((i) => (i === p.img ? imgOf(p, 1200) : px(i, 1200)));
  const details: [string, string][] = [
    ['Product Details', p.desc + ' Colour may vary slightly due to the handmade nature of the product.'],
    [
      'Care Instructions',
      'Hand wash or gentle machine wash in cold water. Dry in shade. Warm iron on the reverse side.',
    ],
    [
      'Delivery & Returns',
      'Delivery across all 64 districts. Inside Dhaka 1–2 days, outside Dhaka 3–5 days. Easy exchange within 7 days if the product is unused with tags.',
    ],
  ];
  const related = S.products
    .filter((x) => x.id !== p.id)
    .sort((a, b) => Number(b.cat === p.cat) - Number(a.cat === p.cat))
    .slice(0, 4);

  return (
    <section className="container" style={{ paddingTop: 28, paddingBottom: 64 }}>
      <div className="crumbs">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={catHref(p.cat)}>{p.cat}</Link>
        <span>/</span>
        <span>{p.name}</span>
      </div>
      <div className="pdp">
        <div className="gallery">
          <div className="gallery-main" style={bg(gallery[img])} role="img" aria-label={p.name} />
          <div className="thumbs">
            {gallery.map((g, i) => (
              <button
                key={g}
                className={`thumb ${i === img ? 'active' : ''}`}
                style={bg(g)}
                onClick={() => setImg(i)}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        </div>
        <div className="pdp-info">
          <div className="pdp-head">
            <span className="eyebrow" style={{ letterSpacing: '.06em' }}>
              {p.cat}
            </span>
            <h1>{p.name}</h1>
            <div className="pdp-meta">
              ★ 4.8 ({40 + p.name.length * 3} reviews) · SKU BN-{p.id.toUpperCase()}-{size + 1} · <b>In stock</b>
            </div>
            <div className="price-row" style={{ gap: 10 }}>
              <span className="pdp-price">৳{fmt(unit)}</span>
              {p.was && size === 0 && <span className="pdp-was">৳{fmt(p.was)}</span>}
            </div>
          </div>
          <p className="pdp-desc">{p.desc}</p>
          <div>
            <div className="opt-label">
              Size: <span>{sizes[size]}</span>
            </div>
            <div className="sizes">
              {sizes.map((s, i) => (
                <button key={s} className={`size ${i === size ? 'active' : ''}`} onClick={() => setSize(i)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="buy-row">
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">
                −
              </button>
              <span>{qty}</span>
              <button onClick={() => setQty(qty + 1)} aria-label="Increase">
                +
              </button>
            </div>
            <button
              className="btn btn-green-outline"
              onClick={() => {
                add(p.id, size, qty);
                setOpen(true);
              }}
            >
              Add to Cart
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                add(p.id, size, qty);
                router.push('/checkout');
              }}
            >
              Buy Now · ৳{fmt(unit * qty)}
            </button>
          </div>
          <div className="ship-info">
            <span>
              <b>Inside Dhaka:</b> ৳{S.delivery.dhaka} · 1–2 days
            </span>
            <span>
              <b>Outside Dhaka:</b> ৳{S.delivery.outside} · 3–5 days
            </span>
            <span>
              <b>Payment:</b> COD, bKash, Nagad, Card
            </span>
          </div>
          <Accordion items={details} />
        </div>
      </div>
      <div className="related">
        <h2 className="h2">You May Also Like</h2>
        <div className="grid-products">
          {related.map((x) => (
            <ProductCard key={x.id} p={x} />
          ))}
        </div>
      </div>
    </section>
  );
}
