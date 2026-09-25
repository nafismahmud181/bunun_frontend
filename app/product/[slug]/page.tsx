import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { connection } from 'next/server';
import { getCategories, getProduct, listProducts } from '@/lib/catalogue';
import { productHref } from '@/lib/utils';
import ProductDetail from '@/components/ProductDetail';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  return p ? { title: p.seoTitle ?? p.name, description: p.seoDescription ?? p.description ?? undefined } : {};
}

export default async function ProductPage({ params }: Props) {
  await connection();
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) {
    // Old links used ids like /product/r1; send them to the product's new address.
    const legacy = /^[a-z]\d{1,4}$/.test(slug) ? (await listProducts({ legacyId: slug, limit: 1 })).items[0] : null;
    if (legacy) permanentRedirect(productHref(legacy.slug));
    notFound();
  }
  const [all, categories] = await Promise.all([listProducts({ limit: 100 }), getCategories()]);
  return (
    <ProductDetail
      key={p.slug}
      p={p}
      others={all.items.filter((x) => x.slug !== p.slug)}
      categoryImage={categories.find((c) => c.slug === p.category.slug)?.imageUrl ?? null}
    />
  );
}
