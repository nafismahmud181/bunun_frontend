import Link from 'next/link';
import { STORE as S } from '@/lib/store';
import { bg, byIds, catHref, faqs, fmt, imgOf, px } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';
import Countdown from '@/components/Countdown';
import Accordion from '@/components/Accordion';
import Newsletter from '@/components/Newsletter';

const TRUST: [string, string, string][] = [
  ['COD', 'Cash on Delivery', 'Pay at your doorstep'],
  ['64', 'Nationwide Delivery', 'All 64 districts'],
  ['৳', 'bKash & Nagad', 'Secure mobile payment'],
  ['7d', 'Easy Exchange', 'Within 7 days'],
];

export default function HomePage() {
  const picks = S.products
    .filter((p) => p.was)
    .concat(S.products.filter((p) => !p.was && p.tag))
    .slice(0, 4);

  return (
    <>
      <section className="hero2">
        <div className="container hero2-grid">
          <div className="hero2-main">
            <div className="eyebrow">Festive Sale · Limited Time</div>
            <h1>
              Up to <em>25% off</em> handcrafted runners, kantha &amp; jute
            </h1>
            <p>Dress your home for the season with pieces made by artisans in Jashore, Tangail and Rangpur.</p>
            <Countdown end={S.saleEnds} />
            <div className="hero2-actions">
              <Link className="btn btn-primary" href="/shop">
                Shop the Sale
              </Link>
              <Link className="btn btn-outline" href={catHref('Table Runners')}>
                Table Runners
              </Link>
            </div>
          </div>
          <div className="hero2-side">
            {picks.map((p) => (
              <Link className="pick" key={p.id} href={`/product/${p.id}`}>
                <div className="pick-img" style={bg(imgOf(p, 600))}>
                  {p.was && <span className="pick-off">-{Math.round((1 - p.price / p.was) * 100)}%</span>}
                </div>
                <div className="pick-body">
                  <b>{p.name}</b>
                  <span>
                    ৳{fmt(p.price)}
                    {p.was && <s>৳{fmt(p.was)}</s>}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="trust">
        <div className="container">
          {TRUST.map(([m, t, s]) => (
            <div className="trust-item" key={t}>
              <span className="trust-mark">{m}</span>
              <div>
                <b>{t}</b>
                <small>{s}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container section" style={{ paddingBottom: 16 }}>
        <h2 className="h2" style={{ marginBottom: 24 }}>
          Shop by Category
        </h2>
        <div className="grid-cats">
          {S.categories.map((c) => (
            <Link className="cat-tile" key={c} href={catHref(c)}>
              <div className="cat-img" style={bg(px(S.categoryImages[c] ?? 0))} />
              <div className="cat-body">
                <b>{c}</b>
                <small>{S.products.filter((p) => p.cat === c).length} products</small>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div className="section-head">
          <h2 className="h2">Best Sellers</h2>
          <Link className="link-btn" href="/shop">
            View all →
          </Link>
        </div>
        <div className="grid-products">
          {byIds(S.bestsellers).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 64 }}>
        <div className="promos">
          <div className="promo" style={bg(px(17240972, 1200))}>
            <div className="promo-body">
              <span className="promo-tag red">Up to 25% Off</span>
              <h3>Eid Festive Collection</h3>
              <p>Jamdani runners and kantha linens to welcome guests in style.</p>
              <Link className="btn btn-white" href={catHref('Table Runners')}>
                Shop Festive
              </Link>
            </div>
          </div>
          <div className="promo" style={bg(px(8479733, 1200))}>
            <div className="promo-body">
              <span className="promo-tag">Buy 2, Get 1 Free</span>
              <h3>Cushion Cover Combo</h3>
              <p>Mix and match any three cushion covers — refresh your sofa for less.</p>
              <Link className="btn btn-white" href={catHref('Cushion Covers')}>
                Shop Cushions
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 64 }}>
        <div className="section-head">
          <h2 className="h2">New Arrivals</h2>
          <Link className="link-btn" href="/shop">
            View all →
          </Link>
        </div>
        <div className="grid-products">
          {byIds(S.newArrivals).map((p) => (
            <ProductCard key={p.id} p={p} forceNew />
          ))}
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 64 }}>
        <h2 className="h2" style={{ marginBottom: 24 }}>
          Shop by Budget
        </h2>
        <div className="grid-budget">
          {[1000, 2000, 3000, 5000].map((a) => (
            <Link className="budget" key={a} href={`/shop?max=${a}&sort=low`}>
              <small>Under</small>
              <strong>৳{fmt(a)}</strong>
              <span>{S.products.filter((p) => p.price < a).length} products →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="story">
        <div className="container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={px(6634704, 1200)} alt="Artisan weaving on a wooden loom" />
          <div className="story-copy">
            <div className="eyebrow">Our Artisans</div>
            <h2>Supporting 120+ rural craftswomen across Bangladesh</h2>
            <p>
              Every runner and cushion cover is hand-finished by artisan groups we work with directly — fair wages,
              natural fibres, and quality checked in Dhaka before dispatch.
            </p>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingTop: 64 }}>
        <div className="section-head">
          <h2 className="h2">What Our Customers Say</h2>
          <span className="muted">★ 4.8 average from 2,300+ reviews</span>
        </div>
        <div className="grid-reviews">
          {S.reviews.map((r) => (
            <div className="review" key={r.name}>
              <span className="stars">★★★★★</span>
              <p>“{r.text}”</p>
              <div className="review-by">
                <span className="avatar">{r.name[0]}</span>
                <div>
                  <b>{r.name}</b>
                  <small>
                    {r.city} · Verified buyer · {r.item}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="faq-wrap" id="faq">
        <h2 className="h2">Frequently Asked Questions</h2>
        <Accordion items={faqs()} />
      </section>

      <section className="container section">
        <Newsletter />
      </section>
    </>
  );
}
