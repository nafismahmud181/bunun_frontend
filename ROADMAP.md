# Bunon: Full E‑commerce Roadmap

A plan to turn the current Next.js storefront into a complete online store for the Bangladesh market, with a backend, an admin panel, payments, courier integration and a production launch.

> **Estimated timeline:** about 10–12 weeks for one developer.
> **Minimum launch:** after Phase 3 (Cash on Delivery only). Phases 4–8 can follow while the store is live.

---

## Contents

1. [Where the project is now](#1-where-the-project-is-now)
2. [Architecture](#2-architecture)
3. [Data model](#3-data-model)
4. [Backend modules and rules](#4-backend-modules-and-rules)
5. [Admin panel](#5-admin-panel)
6. [Storefront changes](#6-storefront-changes)
7. [Security checklist](#7-security-checklist)
8. [Testing and quality](#8-testing-and-quality)
9. [Phased roadmap](#9-phased-roadmap)
10. [Start these now (paperwork)](#10-start-these-now-paperwork)
11. [Go‑live checklist](#11-golive-checklist)
12. [Open decisions](#12-open-decisions)

---

## 1. Where the project is now

A Next.js 16 / React 19 storefront (home, shop, product, checkout and order‑success pages) of about 880 lines, with no backend.

| Area | Current state | Problem |
|---|---|---|
| Catalogue | Hardcoded in `lib/store.js` | Only a developer can edit products |
| Cart | Browser `localStorage` only | Lost when the shopper switches device; no stock check |
| Totals | Worked out in the browser (`app/checkout/page.js`) | Anyone can change the price they pay |
| Orders | `TODO`; nothing is saved | No orders reach the business |
| Order number | Random `HL` + 6 digits (now `BN`) | Two orders can get the same number |
| Variants | Size prices come from the `sizeUplift` formula | No SKUs, no stock counts |
| Account / Wishlist / বাংলা | Placeholders | Not working |

**Goal:** keep the existing design and move the data, logic and trust to the server.

---

## 2. Architecture

```
/frontend   Next.js storefront (existing): SSR/ISR pages, calls the API
/admin      Next.js admin panel: separate app, separate login
/backend    Node API (NestJS or Express) + Prisma + PostgreSQL
            ├─ REST API  /api/v1/...
            ├─ Payment webhooks / IPN (bKash, Nagad, SSLCommerz)
            ├─ Background jobs (BullMQ + Redis): SMS, email, courier sync, stock release
            └─ Media upload → Cloudinary or Cloudflare R2
```

**Why separate apps:** a separate API can later serve a mobile app or a Facebook/WhatsApp bot without a rewrite. Keeping the admin panel apart means a storefront bug can't expose admin routes.

**Simpler option:** one Next.js app with `/admin` routes and Route Handlers. Fine for a solo developer with a small catalogue, but harder to split up later.

### Stack

| Area | Choice |
|---|---|
| Language | TypeScript everywhere |
| Database | PostgreSQL (Neon, Supabase, or self‑hosted) |
| Data access | Prisma, which also handles schema migrations |
| Validation | Zod, with schemas shared by frontend and backend |
| Customer login | Phone number + SMS code |
| Admin login | Email + password + two‑factor authentication, JWT in httpOnly cookies |
| Queue and cache | Redis (Upstash, or on a VPS) + BullMQ |
| Admin UI | Next.js + Tailwind/shadcn (or Ant Design); TanStack Table for tables |
| Images | Cloudinary or Cloudflare R2 |
| Hosting | Frontend and admin on Vercel; backend, database and Redis on a VPS (DigitalOcean Singapore / AWS ap‑south‑1) or Railway/Render |
| Monitoring | Sentry for errors, plus an uptime monitor |

---

## 3. Data model

### Catalogue
- **categories**: id, name_en, name_bn, slug, image, sort, active
- **products**: id, slug, name_en/bn, description_en/bn, category_id, tag, status (draft / active / archived), SEO fields
- **product_variants**: sku, product_id, label (e.g. `13 × 90"`), price, compare_at_price, stock, weight. Replaces `sizeUplift`.
- **product_images**: url, alt, sort
- **inventory_movements**: variant, change (+/−), reason, order_id, admin_id. The record behind every stock change.

### Customers
- **customers**: phone (unique), name, email (optional)
- **addresses**: division → district → upazila/area, full address, is_default

### Carts
- **carts** / **cart_items**: linked to a guest token or a customer. The server copy is the real one; `localStorage` just mirrors it.

### Orders
- **orders**: order_no from a database sequence (`BN-2026-000123`), customer, address snapshot, subtotal, discount, delivery_fee, total, status, payment_status, notes, ip, source (web / Facebook / manual)
- **order_items**: copies the name, SKU, label and unit price at the time of the order
- **order_status_history**: who changed the status, when, and why

### Payments and shipping
- **payments**: order, method, gateway transaction id, amount, status, raw_response
- **refunds**
- **shipments**: courier, consignment_id, tracking_code, COD amount, status, charges
- **delivery_zones**: Inside Dhaka / Dhaka suburbs / Outside Dhaka, fee, delivery estimate

### Marketing and content
- **coupons**: % or fixed amount, minimum spend, usage limits, dates, category/product scope
- **banners**, **homepage_sections** (bestseller and new‑arrival lists)
- **newsletter_subscribers**
- **reviews** (verified buyers only, needs approval), **wishlist_items**
- **settings**: free‑delivery threshold, sale end date, hotline, social links, COD advance rule

### Admin
- **admin_users**, **roles** / **permissions**, **audit_logs**

### Status flows
- **Order:** `pending → confirmed → processing → shipped → delivered`, with side branches to `cancelled`, `returned`, `refunded`
- **Payment:** `unpaid`, `partially_paid` (COD advance), `paid`, `refunded`

---

## 4. Backend modules and rules

1. **Auth**
   - Customers log in with a 6‑digit SMS code, valid 5 minutes, 3 tries, with a limit on requests per phone and per IP.
   - Guests can check out without an account.
   - Admins log in with email, password and two‑factor authentication.
2. **Catalogue API**
   - List products with filters (category, search, price range, sort, pagination); look up products by slug.
   - Search uses PostgreSQL full‑text or trigram matching and covers Bangla names.
3. **Cart and pricing**
   - The server **always recalculates** prices, discounts and delivery fees. Nothing the browser sends about money is trusted.
4. **Checkout (one database transaction)**
   - Validate the details.
   - Lock stock for the order's variants (`SELECT … FOR UPDATE`) and reserve it.
   - Create the order, then either start the payment or confirm the COD order.
   - Accept an idempotency key so a double‑click can't create two orders.
   - Release reserved stock after 30 minutes if an online payment never completes (a background job).
5. **Payments** (one common payment interface, with a separate adapter for each gateway)
   - **SSLCommerz:** cards, mobile banking and internet banking. Check every IPN notification against SSLCommerz's validation API.
   - **bKash:** Tokenized Checkout (create → execute → query). If the callback never arrives, a background job asks bKash for the payment status.
   - **Nagad:** its merchant API uses RSA‑signed requests.
   - **COD:** optionally collect the delivery fee in advance via bKash to cut down fake orders.
   - Only the server‑to‑server confirmation marks an order paid, **never** the browser redirect.
6. **Couriers** (Steadfast, Pathao, RedX)
   - The admin books a shipment from the order page with one click and gets a tracking code.
   - A webhook or background job keeps the shipment status up to date.
   - Delivered COD orders are matched against courier payouts.
7. **Fraud and fake‑order checks** (very important for COD in Bangladesh)
   - Check the phone number's delivery‑success history through the courier APIs.
   - Block phone numbers or IPs on a blacklist.
   - Limit how often the same phone number or IP can order.
   - Flag suspicious orders for manual confirmation by phone.
8. **Notifications**
   - SMS (SSL Wireless / BulkSMSBD / Alpha SMS) when an order is placed, confirmed or shipped (with the tracking link).
   - Email (Resend, SES or SMTP).
   - Alerts to the admin on new orders (email, Telegram or Slack).
9. **Media**
   - Images are uploaded straight to Cloudinary or R2 (signed uploads), then converted to WebP in several sizes.
10. **Admin API**
    - Create, read, update and delete everything.
    - A permission check on every route, and an audit log entry for every change.

---

## 5. Admin panel

| Module | Features |
|---|---|
| **Dashboard** | Today's and this month's sales, number of orders, average order value, orders by status, top products, low‑stock alerts, revenue chart |
| **Orders** | Filters (status, payment, date, phone), order detail, change status, edit before shipping, internal notes, call‑to‑confirm button, invoice and packing slip (PDF), book courier, refund, bulk actions, CSV export |
| **Manual orders** | Enter orders taken on Facebook, WhatsApp or by phone |
| **Products** | Bangla and English fields, variants with their own SKU, price and stock, image upload and reordering, draft/active status, SEO, duplicate, bulk price and stock changes, CSV import/export |
| **Categories** | Create, edit, reorder, set images |
| **Inventory** | Adjust stock with a reason, stock history, low‑stock levels |
| **Customers** | Profile, order history, total spend, delivery success rate, block, notes |
| **Coupons** | Create, set rules, see usage |
| **Content** | Hero and sale banners, countdown date, homepage sections, FAQ, customer reviews shown on the site, pages (About, Return Policy, Terms, Privacy) |
| **Reviews** | Approve or reject |
| **Settings** | Delivery zones and fees, free‑delivery threshold, payment methods on/off, courier and SMS keys (encrypted), store info |
| **Staff** | Roles such as Owner, Manager, Order Handler, Content Editor; invite, disable |
| **Reports** | Sales by day, product and category; payment method split; courier and return performance |

---

## 6. Storefront changes

- [ ] Replace `lib/store.js` with API calls in Server Components; cache pages with ISR and refresh them on demand when the admin saves a product
- [ ] Change product URLs from `/product/r1` to `/product/nakshi-kantha-table-runner` (slugs)
- [ ] Cart: works without login, syncs to the server, shows live stock ("Only 2 left", "Out of stock")
- [ ] Checkout: pick the address step by step (division → district → area), delivery fee from the zone, coupon field, real payment redirects
- [ ] Order confirmation page and a **track order** page (order number + phone)
- [ ] Account: log in with an SMS code, order history, saved addresses, wishlist, reorder
- [ ] Full product search, filters, and pagination or infinite scroll
- [ ] Reviews on product pages, written by verified buyers
- [ ] **Bangla/English** with `next-intl` (`/bn` and `/en` routes) and a Bangla font (Hind Siliguri or Noto Sans Bengali)
- [ ] SEO: metadata, Open Graph images, product structured data, `sitemap.xml`, `robots.txt`, canonical URLs
- [ ] Tracking: Facebook Pixel **plus the Conversions API sent from the server**, GA4, Google Tag Manager
- [ ] Legal pages required by payment gateways: Privacy, Terms, Refund/Return, About with the business address

---

## 7. Security checklist

- [ ] Validate input on the server for every endpoint (Zod)
- [ ] Use Prisma's parameterised queries; never build SQL from strings
- [ ] Rate limits on logins, SMS codes, checkout and search
- [ ] CORS allows only your domains; Helmet security headers; CSRF protection with cookie login
- [ ] Hash admin passwords with argon2 or bcrypt; admins must use two‑factor authentication; sessions time out
- [ ] Check webhook signatures and gateway validation; handle repeated webhook calls safely
- [ ] Keep secrets in environment variables or a secrets manager; encrypt the API keys stored in settings
- [ ] HTTPS everywhere, with HSTS
- [ ] Daily automatic database backups, with a restore that has actually been tested
- [ ] Never store card data; the gateways handle it
- [ ] Record admin actions in the audit log; hide customer phone numbers from roles that don't need them

---

## 8. Testing and quality

- **Unit tests** (Vitest): pricing, discounts, delivery fees, stock reservation, order status transitions
- **Integration tests** against a test PostgreSQL database: checkout, overselling when two orders arrive at once, payment callbacks (mocked gateways), a webhook arriving twice
- **End‑to‑end tests** (Playwright): browse → cart → checkout (COD and sandbox bKash/SSLCommerz) → order shows up in admin → ship → delivered
- **Performance:** load‑test the checkout with k6; Lighthouse ≥ 90 on mobile (most shoppers browse on mid‑range Android phones)
- **Accessibility:** keyboard navigation, contrast, labels
- **Continuous integration** (GitHub Actions): lint → type‑check → test → build; preview deployments for pull requests; database migrations run automatically on deploy

---

## 9. Phased roadmap

### Phase 0: Foundation (Week 1)
- [ ] Git repository and branching strategy
- [ ] Monorepo (pnpm workspaces or Turborepo): `frontend`, `admin`, `backend`, `packages/shared`
- [ ] Move the frontend to TypeScript; set up ESLint and Prettier
- [ ] Database schema v1 with Prisma
- [ ] Seed script that imports the current `lib/store.js` products into the database
- [ ] CI pipeline and a staging environment
- **Done when:** all three apps run locally and the database holds the current catalogue.

### Phase 1: Catalogue API + storefront wiring (Week 2)
- [ ] Product and category API (list, filter, search, look up by slug)
- [ ] Storefront pages read from the API instead of `lib/store.js`
- [ ] Slug URLs; variants with real prices and stock
- [ ] Images moved to the CDN
- **Done when:** the site looks the same as today, but every product comes from the database.

### Phase 2: Orders + Cash on Delivery (Weeks 3–4)
- [ ] Server cart and guest token
- [ ] Checkout transaction with stock locking and an idempotency key
- [ ] Order numbers from a database sequence
- [ ] Division/district/area address picker and delivery zones
- [ ] SMS on order placement
- [ ] Track‑order page
- [ ] Basic fraud checks (rate limits, blacklist)
- **Done when:** a real COD order is saved, stock goes down and the customer gets an SMS.

### Phase 3: Admin panel v1 (Weeks 5–6) → **minimum launch possible**
- [ ] Admin login, two‑factor authentication, roles and permissions
- [ ] Dashboard
- [ ] Orders module (list, detail, status changes, notes, invoice PDF)
- [ ] Manual order entry
- [ ] Products, categories and inventory
- [ ] Customers and settings
- [ ] Audit log
- **Done when:** staff can run daily operations without a developer.

### Phase 4: Online payments (Weeks 7–8)
- [ ] Common payment interface
- [ ] SSLCommerz (payment + IPN validation)
- [ ] bKash Tokenized Checkout, with a background job that checks unconfirmed payments
- [ ] Nagad
- [ ] Optional COD advance payment
- [ ] Payment reconciliation report and refunds
- **Done when:** sandbox and live test payments complete from start to finish.

### Phase 5: Customer accounts + marketing (Week 9)
- [ ] SMS‑code login and account pages (orders, addresses)
- [ ] Wishlist
- [ ] Coupons
- [ ] Reviews and their approval queue
- [ ] Banners and editable homepage sections (CMS)

### Phase 6: Couriers + notifications (Week 10)
- [ ] Steadfast and Pathao (then RedX): booking and tracking sync
- [ ] Courier delivery‑history check for fraud prevention
- [ ] Email templates (order placed, shipped, delivered)
- [ ] Admin alerts for new orders

### Phase 7: Bangla, SEO, analytics (Week 11)
- [ ] Bangla/English language support with `next-intl`
- [ ] Product structured data, sitemap, Open Graph images
- [ ] Facebook Pixel + server‑side Conversions API, GA4, Google Tag Manager

### Phase 8: Hardening + launch (Week 12)
- [ ] Security review against Section 7
- [ ] Load test and Lighthouse checks
- [ ] Backups, Sentry, uptime monitoring
- [ ] Legal pages published
- [ ] Go‑live checklist (Section 11)

---

## 10. Start these now (paperwork)

Gateways and couriers take weeks to approve, so apply while development is under way.

- [ ] Trade licence, TIN and a bank account in the business's name
- [ ] SSLCommerz merchant application
- [ ] bKash payment gateway merchant application
- [ ] Nagad merchant application
- [ ] Courier merchant accounts and API keys: Steadfast, Pathao, RedX
- [ ] SMS gateway account and an approved **sender ID**
- [ ] Domain name and business email
- [ ] Facebook Business Manager and a Pixel

---

## 11. Go‑live checklist

- [ ] Production environment variables set; sandbox keys swapped for live ones
- [ ] Database backups running; one restore tested
- [ ] Live test order placed with each payment method, then refunded
- [ ] Live test courier booking made and cancelled
- [ ] SMS and email arrive on real phones and inboxes
- [ ] Admin two‑factor authentication enabled for every staff account
- [ ] Sentry and uptime alerts reach the owner
- [ ] Sitemap submitted to Google Search Console
- [ ] Pixel and Conversions API events checked in Facebook Events Manager
- [ ] Legal pages linked in the footer
- [ ] Customer‑support hotline and WhatsApp number shown on the site

---

## 12. Open decisions

| # | Decision | Options | Recommendation |
|---|---|---|---|
| 1 | Architecture | Separate backend / single Next.js app | Separate backend |
| 2 | Backend framework | NestJS / Express or Fastify | NestJS if others will join; Express for a solo developer |
| 3 | Hosting | Vercel + managed services (~$20–50/month) / single VPS (~$12–24/month) | Vercel + managed services to start |
| 4 | Launch scope | COD‑only first / wait for online payments | COD‑only first, after Phase 3 |
| 5 | Team | Solo / several developers | Affects how strict the structure should be |
