# Bunon: Next.js Store (Theme 2 "Nakshi")

This is a home décor e-commerce storefront for the Bangladesh market, built with Next.js 16 (App Router), React 19 and TypeScript. Products and categories come from the `bunun_backend` API.

Sibling repositories: `bunun_backend` (API) and `bunun_admin` (admin panel). See `ROADMAP.md` in the project folder for the full plan.

## Run it

Start the backend first (see its README), then:

```bash
cp .env.example .env.local   # API address and revalidation secret
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # production
```

Requires Node.js 20.9 or newer. `NEXT_PUBLIC_API_URL` is baked in at build time, so rebuild after changing it.

## Scripts

| Script                    | What it does                                                 |
| ------------------------- | ------------------------------------------------------------ |
| `dev`                     | Run with reload on change                                    |
| `build` / `start`         | Production build and server (the build doesn't need the API) |
| `lint`                    | ESLint (Next.js rules + TypeScript)                          |
| `typecheck`               | TypeScript, no output                                        |
| `format` / `format:check` | Prettier (write / check only)                                |
| `gen:api`                 | Regenerate `lib/api/schema.d.ts` from the backend's spec     |

CI runs `lint`, `format:check`, `typecheck` and `build` on every push and pull request.

## How catalogue data flows

- Pages are rendered on request. API responses are cached for 60 seconds under the `catalogue` tag (`lib/catalogue.ts`).
- `POST /api/revalidate` with header `x-revalidate-secret: $REVALIDATE_SECRET` refreshes that cache. The admin panel will call it after saving a product. The next visitor still gets the cached copy while fresh data loads, and visitors after that see the change.
- After changing the backend API, run `npm run openapi` in the backend, then `npm run gen:api` here, and commit `lib/api/schema.d.ts`.

## Structure

```
app/
  layout.tsx                Header + Footer + cart provider (categories and store settings from the API)
  page.tsx                  Home (sale hero, categories, best sellers, promos, reviews, FAQ)
  shop/page.tsx             Listing: ?cat=<slug> ?q= ?max= ?sort=low|high (old ?cat=<name> links still work)
  product/[slug]/page.tsx   Product page; old /product/r1 links redirect to the slug
  checkout/page.tsx         Loads the address list, renders CheckoutForm
  order-success/page.tsx    Confirmation with a link to track the order
  track/page.tsx            Track an order by order number + phone
  about, privacy, terms, refund-policy/   Legal pages (text in lib/legal.ts)
  api/revalidate/route.ts   Cache refresh endpoint for the admin panel
  error.tsx                 Shown when a page can't load (e.g. the API is down)
  globals.css               All styles (colour variables at the top)
components/                 Header, Footer, CartProvider, CartDrawer, CheckoutForm, TrackOrder, LegalPage, ProductCard, ProductDetail, …
lib/api/                    Typed API client (openapi-fetch) and generated schema
lib/catalogue.ts            Cached reads for Server Components (catalogue, settings, locations)
lib/cart.ts                 Reads carts saved by older versions, to move them to the server cart
lib/legal.ts                Legal page text: fill in before applying to payment gateways
lib/store.ts                Content not yet in the database: sale end date, reviews
lib/types.ts                API, cart and order types
lib/utils.ts                Price formatting (৳), image helpers, FAQ text
```

## Customising

- **Products, categories, delivery fees, free-delivery threshold, hotline**: in the database (`settings` and `delivery_zones` tables; admin panel from Phase 3).
- **Legal pages**: write the text in `lib/legal.ts`.
- **Colours**: edit the `:root` variables in `app/globals.css`.
- **Sale countdown and homepage reviews**: `saleEnds` and `reviews` in `lib/store.ts`.

## Cart and checkout

- The cart lives on the server. The browser keeps only its token (`localStorage` key `bunon_cart_token`). A cart saved by an older version is moved to the server on the next visit.
- Checkout offers Cash on Delivery only (online payments arrive in Phase 4). The delivery fee comes from the server for the chosen area. Each order attempt sends an `Idempotency-Key`, so a double click or a retry can't create two orders.
- The browser calls the cart, checkout and tracking APIs directly, so rate limits and fraud checks see each shopper's own IP. The API's `CORS_ORIGINS` must include the storefront's address.
- Account, Wishlist and the বাংলা link are placeholders.
