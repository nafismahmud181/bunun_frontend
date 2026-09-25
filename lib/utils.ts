import type { CSSProperties } from 'react';
import type { StoreSettings } from './types';

export const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');
export const px = (id: number, w = 800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
// Uploaded images are stored at these widths, named …-<width>.webp (see the backend's services/images.ts).
const UPLOAD_WIDTHS = [400, 800, 1200];

/**
 * An image URL at (at least) the given width. Uploaded images switch to the smallest stored size
 * that is wide enough; Pexels URLs use their `w` parameter; anything else is returned as-is.
 */
export const imgSrc = (url: string, w = 800) => {
  const uploaded = /-(\d+)\.webp$/.exec(url);
  if (uploaded && UPLOAD_WIDTHS.includes(Number(uploaded[1]))) {
    const size = UPLOAD_WIDTHS.find((s) => s >= w) ?? UPLOAD_WIDTHS[UPLOAD_WIDTHS.length - 1];
    return url.replace(/-\d+\.webp$/, `-${size}.webp`);
  }
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
