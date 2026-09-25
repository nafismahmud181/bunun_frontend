import Link from 'next/link';
import type { LegalPage as Page } from '@/lib/legal';

export default function LegalPage({ page }: { page: Page }) {
  return (
    <section className="container legal">
      <div className="crumbs">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>{page.title}</span>
      </div>
      <h1 className="page-title">{page.title}</h1>
      {page.updated && <p className="muted">{page.updated}</p>}
      {page.sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          {s.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>
      ))}
    </section>
  );
}
