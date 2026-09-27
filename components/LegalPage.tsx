import Link from 'next/link';
import { renderMarkdown } from '@/lib/markdown';
import type { StorePage } from '@/lib/types';

const updated = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long', year: 'numeric' });

/** A legal or information page; the text is written in the admin panel (Content → Store pages). */
export default function LegalPage({ page }: { page: StorePage }) {
  return (
    <section className="container legal">
      <div className="crumbs">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>{page.title}</span>
      </div>
      <h1 className="page-title">{page.title}</h1>
      {page.updatedAt && <p className="muted">Last updated {updated(page.updatedAt)}</p>}
      {renderMarkdown(page.body)}
    </section>
  );
}
