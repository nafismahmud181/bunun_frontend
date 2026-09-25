import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="done">
      <h1>Page not found</h1>
      <p>The page you are looking for doesn&apos;t exist or has moved.</p>
      <Link className="btn btn-primary" href="/shop">Browse Products</Link>
    </section>
  );
}
