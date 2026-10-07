import type { NextConfig } from 'next';

// Other sites may not show the shop inside a frame (clickjacking on checkout). No script
// restrictions yet: Facebook Pixel and Google Analytics come in Phase 7, with a full policy then.
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Browsers only act on this over https (production), so it's harmless on localhost.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.pexels.com' }],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
