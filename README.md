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
  layout.tsx                Header + Footer (categories from the API) + cart provider
  page.tsx                  Home (sale hero, categories, best sellers, promos, reviews, FAQ)
  shop/page.tsx             Listing: ?cat=<slug> ?q= ?max= ?sort=low|high (old ?cat=<name> links still work)
  product/[slug]/page.tsx   Product page; old /product/r1 links redirect to the slug
  checkout/page.tsx         Delivery info, payment method, order summary
  order-success/page.tsx    Confirmation
  api/revalidate/route.ts   Cache refresh endpoint for the admin panel
  error.tsx                 Shown when a page can't load (e.g. the API is down)
  globals.css               All styles (colour variables at the top)
components/                 Header, Footer, CartProvider, CartDrawer, ProductCard, ProductDetail, Accordion, Countdown, Newsletter, SortSelect
lib/api/                    Typed API client (openapi-fetch) and generated schema
lib/catalogue.ts            Cached catalogue reads for Server Components
lib/cart.ts                 Saved-cart parsing (incl. the pre-API format) and refresh
lib/store.ts                Settings not yet in the database: delivery charges, free-delivery threshold, sale end date, reviews
lib/types.ts                API, cart and order types
lib/utils.ts                Price formatting (৳), image helpers
```

## Customising

- **Products and categories**: managed in the database (admin panel from Phase 3).
- **Colours**: edit the `:root` variables in `app/globals.css`.
- **Delivery / free-shipping threshold / sale countdown**: `delivery`, `freeShipAt` and `saleEnds` in `lib/store.ts`.

## Going live

- The cart is stored in `localStorage`, keyed by SKU. On load, prices refresh from the API. The server cart arrives in Phase 2.
- Checkout is front-end only. Phase 2 of the roadmap connects the `TODO` in `app/checkout/page.tsx` to the backend.
- Account, Wishlist and the বাংলা link are placeholders.
