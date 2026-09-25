import type { components } from './api/schema';

// Catalogue types come from the backend's OpenAPI spec (`npm run gen:api`).
type Schemas = components['schemas'];
export type Category = Schemas['Category'];
export type ProductSummary = Schemas['ProductSummary'];
export type ProductDetail = Schemas['ProductDetail'];
export type Variant = Schemas['Variant'];
export type CartVariant = Schemas['CartVariant'];
export type Cart = Schemas['Cart'];
export type CartLine = Schemas['CartLine'];
export type Quote = Schemas['Quote'];
export type StoreSettings = Schemas['StoreSettings'];
export type LocationTree = Schemas['LocationTree'];
export type OrderReceipt = Schemas['OrderReceipt'];
export type TrackedOrder = Schemas['TrackedOrder'];
export type OrderStatus = Schemas['OrderStatus'];
export type ApiErrorBody = Schemas['Error'];

export interface Review {
  name: string;
  city: string;
  item: string;
  text: string;
}

/** Content that isn't in the database yet (the sale banner and reviews come with the CMS in Phase 5). */
export interface Store {
  saleEnds: string;
  reviews: Review[];
}

/** The order just placed, kept for the confirmation page. */
export interface LastOrder {
  orderNo: string;
  phone: string;
  total: number;
}
