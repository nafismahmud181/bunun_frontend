// Catalogue reads for Server Components. Lists are cached for 60 seconds and tagged
// 'catalogue', so POST /api/revalidate can refresh them the moment the admin saves a product.
import { cache } from 'react';
import { api } from './api/client';
import type { paths } from './api/schema';

export type ProductQuery = NonNullable<paths['/api/v1/products']['get']['parameters']['query']>;

const cached = (input: Request) => fetch(input, { next: { revalidate: 60, tags: ['catalogue'] } });

function fail(what: string, status?: number): never {
  throw new Error(`Catalogue API: ${what} failed${status ? ` (HTTP ${status})` : ''}`);
}

export async function getCategories() {
  const { data, response } = await api.GET('/api/v1/categories', { fetch: cached });
  return data ?? fail('categories', response.status);
}

export async function listProducts(query: ProductQuery = {}) {
  const { data, response } = await api.GET('/api/v1/products', { params: { query }, fetch: cached });
  return data ?? fail('product list', response.status);
}

/** Free-delivery threshold, hotline and delivery zones. */
export async function getStoreSettings() {
  const { data, response } = await api.GET('/api/v1/settings', { fetch: cached });
  return data ?? fail('settings', response.status);
}

/** Divisions, districts and areas for the address picker (rarely changes, so cached for an hour). */
export async function getLocations() {
  const { data, response } = await api.GET('/api/v1/locations', {
    fetch: (input: Request) => fetch(input, { next: { revalidate: 3600, tags: ['catalogue'] } }),
  });
  return data ?? fail('locations', response.status);
}

/**
 * A product by slug, or null if it doesn't exist or isn't for sale. Always fetched fresh (once per
 * request): a cached copy would outlive an archived product, because when a cache refresh gets a
 * 404, Next.js keeps serving the old response. Prices and stock on the page are then always current.
 */
export const getProduct = cache(async (slug: string) => {
  const { data, response } = await api.GET('/api/v1/products/{slug}', {
    params: { path: { slug } },
    fetch: (input: Request) => fetch(input, { cache: 'no-store' }),
  });
  if (response.status === 404) return null;
  return data ?? fail('product', response.status);
});
