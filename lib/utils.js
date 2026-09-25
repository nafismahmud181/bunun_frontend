import { STORE as S } from './store';

export const fmt = (n) => Math.round(n).toLocaleString('en-IN');
export const px = (id, w = 800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
export const imgOf = (p, w) => p.imgUrl || px(p.img, w);
export const byId = (id) => S.products.find((p) => p.id === id);
export const unitPrice = (p, size) => Math.round((p.price * (1 + (S.sizeUplift[size] || 0))) / 10) * 10;
export const catHref = (c) => '/shop?cat=' + encodeURIComponent(c);
export const bg = (url) => ({ backgroundImage: `url('${url}')` });

export const faqs = () => [
  ['Do you offer Cash on Delivery?', 'Yes. Cash on Delivery is available in all 64 districts. You can also pay in advance with bKash, Nagad or card.'],
  ['How long does delivery take?', 'Inside Dhaka city 1–2 working days, outside Dhaka 3–5 working days. You will receive SMS updates once your order is dispatched.'],
  ['What are the delivery charges?', `৳${S.delivery.dhaka} inside Dhaka and ৳${S.delivery.outside} outside Dhaka. Delivery is free on orders above ৳${fmt(S.freeShipAt)}.`],
  ['Can I return or exchange a product?', 'Yes, you can exchange within 7 days if the product is unused and in original packaging. Contact our hotline to arrange a pickup.'],
  ['Are the products really handmade?', 'Every item is handmade by artisan groups in Bangladesh, so small variations in colour and stitching are natural and part of its character.'],
];
