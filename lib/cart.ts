/**
 * Reads a cart that an older storefront saved in the browser, so it can be moved to the server
 * cart. Two formats existed: `{ id: 'r1', size: 0, qty }` before Phase 1 (the seed gave that
 * variant SKU `BN-R1-1`), and `{ sku, qty, snapshot }` in Phase 1. Anything else is ignored.
 */
export function parseSavedCart(raw: unknown): { sku: string; qty: number }[] {
  if (!Array.isArray(raw)) return [];
  const bySku = new Map<string, number>();
  for (const x of raw) {
    if (typeof x !== 'object' || x === null) continue;
    const item = x as { sku?: unknown; id?: unknown; size?: unknown; qty?: unknown };
    const qty = Math.max(1, Math.floor(Number(item.qty)) || 1);
    let sku: string | null = null;
    if (typeof item.sku === 'string') sku = item.sku;
    else if (typeof item.id === 'string') sku = `BN-${item.id.toUpperCase()}-${(Number(item.size) || 0) + 1}`;
    if (sku && /^[A-Za-z0-9-]{1,64}$/.test(sku)) bySku.set(sku, (bySku.get(sku) ?? 0) + qty);
  }
  return [...bySku].map(([sku, qty]) => ({ sku, qty }));
}
