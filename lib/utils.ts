import type { CSSProperties } from 'react';
import type { StoreSettings } from './types';

export const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');
export const px = (id: number, w = 800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
/** An image URL at the given width. Pexels URLs are resized through their `w` parameter; others are returned as-is. */
export const imgSrc = (url: string, w = 800) => {
  try {
    const u = new URL(url);
    if (u.hostname !== 'images.pexels.com') return url;
    u.searchParams.set('w', String(w));
    return u.toString();
  } catch {
    return url;
  }
};
export const catHref = (slug: string) => '/shop?cat=' + encodeURIComponent(slug);
export const productHref = (slug: string) => `/product/${slug}`;
export const bg = (url: string): CSSProperties => ({ backgroundImage: `url('${url}')` });

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export const faqs = (s: StoreSettings): [string, string][] => [
  [
    'Do you offer Cash on Delivery?',
    'Yes. Cash on Delivery is available in all 64 districts. You can also pay in advance with bKash, Nagad or card.',
  ],
  [
    'How long does delivery take?',
    'Inside Dhaka city 1–2 working days, outside Dhaka 3–5 working days. You will receive SMS updates once your order is dispatched.',
  ],
  [
    'What are the delivery charges?',
    [
      s.zones.map((z) => `৳${z.fee} ${lowerFirst(z.name.replace(/ City$/, ''))}`).join(' and ') + '.',
      `Delivery is free on orders above ৳${fmt(s.freeDeliveryThreshold)}.`,
    ].join(' '),
  ],
  [
    'Can I return or exchange a product?',
    'Yes, you can exchange within 7 days if the product is unused and in original packaging. Contact our hotline to arrange a pickup.',
  ],
  [
    'Are the products really handmade?',
    'Every item is handmade by artisan groups in Bangladesh, so small variations in colour and stitching are natural and part of its character.',
  ],
];
