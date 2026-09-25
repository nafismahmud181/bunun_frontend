'use client';

import { useRouter } from 'next/navigation';

export default function SortSelect({ sort, params }) {
  const router = useRouter();
  const onChange = (e) => {
    const sp = new URLSearchParams(params);
    sp.set('sort', e.target.value);
    router.push('/shop?' + sp.toString());
  };
  return (
    <select value={sort} onChange={onChange} aria-label="Sort products">
      <option value="featured">Sort: Featured</option>
      <option value="low">Price: Low to High</option>
      <option value="high">Price: High to Low</option>
    </select>
  );
}
