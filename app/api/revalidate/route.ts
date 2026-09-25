import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';

// The admin panel calls this after saving a product or category, so the storefront shows the
// change straight away instead of within 60 seconds. Needs the shared REVALIDATE_SECRET.
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get('x-revalidate-secret') !== secret) {
    return Response.json({ revalidated: false }, { status: 401 });
  }
  revalidateTag('catalogue', 'max');
  return Response.json({ revalidated: true });
}
