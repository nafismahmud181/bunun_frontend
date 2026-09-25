import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';

// The API calls this after staff change a product, category or stock, so the storefront shows the
// change straight away instead of within 60 seconds. Needs the shared REVALIDATE_SECRET.
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get('x-revalidate-secret') !== secret) {
    return Response.json({ revalidated: false }, { status: 401 });
  }
  // expire: 0 drops the cached data outright. With stale-while-revalidate ('max'), a product
  // that was archived or unpublished stayed visible: its refresh gets a 404, which Next.js
  // treats as a failed refresh, so it kept serving the old page.
  revalidateTag('catalogue', { expire: 0 });
  return Response.json({ revalidated: true });
}
