import type { components } from './api/schema';

// Catalogue types come from the backend's OpenAPI spec (`npm run gen:api`).
type Schemas = components['schemas'];
export type Category = Schemas['Category'];
export type ProductSummary = Schemas['ProductSummary'];
export type ProductDetail = Schemas['ProductDetail'];
export type Variant = Schemas['Variant'];
export type CartVariant = Schemas['CartVariant'];

export interface Review {
  name: string;
  city: string;
  item: string;
  text: string;
}

/** Store settings that aren't in the database yet (delivery zones and reviews come in Phases 2 and 5). */
export interface Store {
  freeShipAt: number;
  saleEnds: string;
  delivery: Record<DeliveryArea, number>;
  reviews: Review[];
}

export type DeliveryArea = 'dhaka' | 'outside';

export type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'card';

/** What the cart stores: a variant, a quantity, and a copy of what to show until the API refreshes it. */
export interface CartItem {
  sku: string;
  qty: number;
  snapshot: CartSnapshot;
}

export interface CartSnapshot {
  slug: string;
  name: string;
  label: string;
  price: number;
  image: string | null;
}

/** A cart item with its line total. */
export interface CartLine extends CartItem {
  total: number;
}

export interface Order {
  no: string;
  name: string;
  phone: string;
  area: DeliveryArea;
  address: string;
  payment: PaymentMethod;
  items: { sku: string; name: string; size: string; qty: number; total: number }[];
  subtotal: number;
  delivery: number;
  total: number;
}
