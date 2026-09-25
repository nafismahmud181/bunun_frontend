import { notFound } from 'next/navigation';
import { STORE as S } from '@/lib/store';
import { byId } from '@/lib/utils';
import ProductDetail from '@/components/ProductDetail';

export function generateStaticParams() {
  return S.products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = byId(id);
  return p ? { title: p.name, description: p.desc } : {};
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  if (!byId(id)) notFound();
  return <ProductDetail key={id} id={id} />;
}
