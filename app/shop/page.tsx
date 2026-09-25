import type { Metadata } from 'next';
import Link from 'next/link';
import { getCategories, listProducts, type ProductQuery } from '@/lib/catalogue';
import { catHref, fmt } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';
import SortSelect from '@/components/SortSelect';

export const metadata: Metadata = { title: 'Shop' };

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
// The storefront's sort values, kept so existing links work.
const SORTS: Record<string, ProductQuery['sort']> = { low: 'price_asc', high: 'price_desc' };

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = (await searchParams) || {};
  const cat = one(sp.cat) || 'All';
  const q = (one(sp.q) || '').trim();
  const max = Number(one(sp.max)) || 0;
  const sort = one(sp.sort) || 'featured';

  const categories = await getCategories();
  // ?cat= takes a slug; older links used the category name.
  const category = categories.find((c) => c.slug === cat || c.name === cat);
  const { items: list, total } = await listProducts({
    ...(cat !== 'All' && { category: category?.slug ?? cat }),
    ...(q && { q }),
    ...(max > 0 && { maxPrice: max }),
    sort: SORTS[sort] ?? 'featured',
    limit: 100,
  });

  const title = q
    ? 'Search results'
    : max
      ? `Under ৳${fmt(max)}`
      : cat === 'All'
        ? 'All Products'
        : (category?.name ?? cat);
  const params = Object.fromEntries(Object.entries(sp).filter((e): e is [string, string] => typeof e[1] === 'string'));

  return (
    <section className="container" style={{ paddingTop: 28, paddingBottom: 64 }}>
      <div className="crumbs">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>{title}</span>
      </div>
      <h1 className="page-title">{title}</h1>
      <div className="toolbar">
        <div className="chips">
          <Link className={`chip ${cat === 'All' && !max ? 'active' : ''}`} href="/shop">
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              className={`chip ${c.slug === category?.slug && !max ? 'active' : ''}`}
              href={catHref(c.slug)}
            >
              {c.name}
            </Link>
          ))}
        </div>
        <div className="sort">
          <span>{total} products</span>
          <SortSelect sort={sort} params={params} />
        </div>
      </div>
      {list.length === 0 && <div className="empty">No products match “{q}”.</div>}
      <div className="grid-products">
        {list.map((p) => (
          <ProductCard key={p.slug} p={p} />
        ))}
      </div>
    </section>
  );
}
