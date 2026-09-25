// Catalogue reads for Server Components. Responses are cached for 60 seconds and tagged
// 'catalogue', so POST /api/revalidate can refresh them the moment the admin saves a product.
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

/** A product by slug, or null if it doesn't exist or isn't for sale. */
export async function getProduct(slug: string) {
  const { data, response } = await api.GET('/api/v1/products/{slug}', {
    params: { path: { slug } },
    fetch: cached,
  });
  if (response.status === 404) return null;
  return data ?? fail('product', response.status);
}
