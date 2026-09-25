import Link from 'next/link';
import { STORE as S } from '@/lib/store';
import { catHref, fmt } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';
import SortSelect from '@/components/SortSelect';

export const metadata = { title: 'Shop' };

export default async function ShopPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const cat = sp.cat || 'All';
  const q = (sp.q || '').trim();
  const max = Number(sp.max) || 0;
  const sort = sp.sort || 'featured';

  let list = S.products.filter((p) => cat === 'All' || p.cat === cat);
  if (max) list = list.filter((p) => p.price < max);
  if (q) list = list.filter((p) => (p.name + ' ' + p.cat).toLowerCase().includes(q.toLowerCase()));
  if (sort === 'low') list = [...list].sort((a, b) => a.price - b.price);
  if (sort === 'high') list = [...list].sort((a, b) => b.price - a.price);

  const title = q ? 'Search results' : max ? `Under ৳${fmt(max)}` : cat === 'All' ? 'All Products' : cat;
  const params = Object.fromEntries(Object.entries(sp).filter(([, v]) => typeof v === 'string'));

  return (
    <section className="container" style={{ paddingTop: 28, paddingBottom: 64 }}>
      <div className="crumbs"><Link href="/">Home</Link><span>/</span><span>{title}</span></div>
      <h1 className="page-title">{title}</h1>
      <div className="toolbar">
        <div className="chips">
          {['All', ...S.categories].map((c) => (
            <Link key={c} className={`chip ${c === cat && !max ? 'active' : ''}`} href={c === 'All' ? '/shop' : catHref(c)}>{c}</Link>
          ))}
        </div>
        <div className="sort">
          <span>{list.length} products</span>
          <SortSelect sort={sort} params={params} />
        </div>
      </div>
      {list.length === 0 && <div className="empty">No products match “{q}”.</div>}
      <div className="grid-products">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </section>
  );
}
