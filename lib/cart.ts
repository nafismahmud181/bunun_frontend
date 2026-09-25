import type { CartItem, CartVariant } from './types';

/** Carts saved before Phase 1 stored `{ id: 'r1', size: 0 }`; the seed gave those variants SKU `BN-R1-1`. */
interface LegacyCartItem {
  id: string;
  size: number;
  qty: number;
}

const isLegacy = (x: unknown): x is LegacyCartItem =>
  typeof x === 'object' && x !== null && typeof (x as LegacyCartItem).id === 'string' && !('sku' in x);

const isCurrent = (x: unknown): x is CartItem =>
  typeof x === 'object' &&
  x !== null &&
  typeof (x as CartItem).sku === 'string' &&
  typeof (x as CartItem).qty === 'number' &&
  typeof (x as CartItem).snapshot === 'object' &&
  (x as CartItem).snapshot !== null;

/**
 * Reads a saved cart, converting the old format. Old items have no snapshot yet, so they get an
 * empty one that the API refresh fills in (and drops if the SKU no longer exists).
 */
export function parseSavedCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const items: CartItem[] = [];
  for (const x of raw) {
    if (isCurrent(x)) items.push(x);
    else if (isLegacy(x))
      items.push({
        sku: `BN-${x.id.toUpperCase()}-${Number(x.size) + 1}`,
        qty: Math.max(1, Number(x.qty) || 1),
        snapshot: { slug: '', name: '', label: '', price: 0, image: null },
      });
  }
  // Merge duplicates (e.g. the same item saved in both formats).
  const bySku = new Map<string, CartItem>();
  for (const item of items) {
    const prev = bySku.get(item.sku);
    bySku.set(item.sku, prev ? { ...prev, qty: prev.qty + item.qty } : item);
  }
  return [...bySku.values()];
}

/** Updates snapshots from fresh API data and drops items the API no longer returns. */
export function refreshCart(items: CartItem[], fresh: CartVariant[]): CartItem[] {
  const bySku = new Map(fresh.map((v) => [v.sku, v]));
  return items.flatMap((item) => {
    const v = bySku.get(item.sku);
    if (!v) return [];
    return [
      {
        ...item,
        snapshot: {
          slug: v.product.slug,
          name: v.product.name,
          label: v.label,
          price: v.price,
          image: v.product.image?.url ?? null,
        },
      },
    ];
  });
}
