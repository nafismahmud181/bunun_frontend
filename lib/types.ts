export interface Product {
  id: string;
  name: string;
  cat: string;
  price: number;
  was?: number;
  tag?: string;
  /** Pexels photo ID */
  img: number;
  /** Own image URL; overrides `img` */
  imgUrl?: string;
  desc: string;
}

export interface Review {
  name: string;
  city: string;
  item: string;
  text: string;
}

export interface Store {
  freeShipAt: number;
  saleEnds: string;
  delivery: Record<DeliveryArea, number>;
  categories: string[];
  categoryImages: Record<string, number>;
  sizes: Record<string, string[]>;
  sizeUplift: number[];
  bestsellers: string[];
  newArrivals: string[];
  products: Product[];
  reviews: Review[];
}

export type DeliveryArea = 'dhaka' | 'outside';

export type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'card';

/** What the cart stores: a product, a size index and a quantity. */
export interface CartItem {
  key: string;
  id: string;
  size: number;
  qty: number;
}

/** A cart item joined with its product and price. */
export interface CartLine extends CartItem {
  p: Product;
  sizeLabel: string;
  total: number;
}

export interface Order {
  no: string;
  name: string;
  phone: string;
  area: DeliveryArea;
  address: string;
  payment: PaymentMethod;
  items: { id: string; name: string; size: string; qty: number; total: number }[];
  subtotal: number;
  delivery: number;
  total: number;
}
