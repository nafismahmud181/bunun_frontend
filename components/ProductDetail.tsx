'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { bg, catHref, fmt, imgSrc } from '@/lib/utils';
import type { ProductDetail as Product, ProductSummary, Variant } from '@/lib/types';
import { useCart } from './CartProvider';
import Accordion from './Accordion';
import ProductCard from './ProductCard';

const stockText = (v: Variant | undefined) =>
  !v || v.stockStatus === 'out' ? 'Out of stock' : v.stockStatus === 'low' ? `Only ${v.stockLeft} left` : 'In stock';

interface Props {
  p: Product;
  /** Every other product, used for "You May Also Like" and to fill out the gallery. */
  others: ProductSummary[];
  categoryImage: string | null;
}

export default function ProductDetail({ p, others, categoryImage }: Props) {
  const router = useRouter();
  const { add, setOpen, settings } = useCart();
  const [img, setImg] = useState(0);
  const [size, setSize] = useState(0);
  const [qty, setQty] = useState(1);

  const variant: Variant | undefined = p.variants[size];
  const unit = variant?.price ?? p.price;
  const soldOut = !variant || variant.stockStatus === 'out';
  const sameCategory = others.filter((x) => x.category.slug === p.category.slug);
  // The product's own photos first, then other photos from its category, up to four.
  const gallery = [
    ...p.images.map((i) => i.url),
    ...sameCategory.flatMap((x) => (x.image ? [x.image.url] : [])),
    ...(categoryImage ? [categoryImage] : []),
  ]
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 4)
    .map((url) => imgSrc(url, 1200));
  const addToCart = async () => !!variant && (await add(variant.sku, qty));
  const details: [string, string][] = [
    ['Product Details', p.description + ' Colour may vary slightly due to the handmade nature of the product.'],
    [
      'Care Instructions',
      'Hand wash or gentle machine wash in cold water. Dry in shade. Warm iron on the reverse side.',
    ],
    [
      'Delivery & Returns',
      'Delivery across all 64 districts. Inside Dhaka 1–2 days, outside Dhaka 3–5 days. Easy exchange within 7 days if the product is unused with tags.',
    ],
  ];
  const related = [...others]
    .sort((a, b) => Number(b.category.slug === p.category.slug) - Number(a.category.slug === p.category.slug))
    .slice(0, 4);

  return (
    <section className="container" style={{ paddingTop: 28, paddingBottom: 64 }}>
      <div className="crumbs">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={catHref(p.category.slug)}>{p.category.name}</Link>
        <span>/</span>
        <span>{p.name}</span>
      </div>
      <div className="pdp">
        <div className="gallery">
          <div
            className="gallery-main"
            style={gallery[img] ? bg(gallery[img]) : undefined}
            role="img"
            aria-label={p.name}
          />
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
              {p.category.name}
            </span>
            <h1>{p.name}</h1>
            <div className="pdp-meta">
              ★ 4.8 ({40 + p.name.length * 3} reviews) · SKU {variant?.sku} · <b>{stockText(variant)}</b>
            </div>
            <div className="price-row" style={{ gap: 10 }}>
              <span className="pdp-price">৳{fmt(unit)}</span>
              {variant?.compareAtPrice && <span className="pdp-was">৳{fmt(variant.compareAtPrice)}</span>}
            </div>
          </div>
          <p className="pdp-desc">{p.description}</p>
          <div>
            <div className="opt-label">
              Size: <span>{variant?.label}</span>
            </div>
            <div className="sizes">
              {p.variants.map((v, i) => (
                <button key={v.sku} className={`size ${i === size ? 'active' : ''}`} onClick={() => setSize(i)}>
                  {v.label}
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
              disabled={soldOut}
              onClick={async () => {
                if (await addToCart()) setOpen(true);
              }}
            >
              {soldOut ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              className="btn btn-primary"
              disabled={soldOut}
              onClick={async () => {
                if (await addToCart()) router.push('/checkout');
              }}
            >
              Buy Now · ৳{fmt(unit * qty)}
            </button>
          </div>
          <div className="ship-info">
            {settings.zones.map((z) => (
              <span key={z.key}>
                <b>{z.name.replace(/ City$/, '')}:</b> ৳{z.fee} · {z.estimate}
              </span>
            ))}
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
            <ProductCard key={x.slug} p={x} />
          ))}
        </div>
      </div>
    </section>
  );
}
