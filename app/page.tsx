import Link from 'next/link';
import type { ReactNode } from 'react';
import { getCategories, getContent, getFeaturedReviews, listProducts } from '@/lib/catalogue';
import { bg, catHref, fmt, imgSrc, productHref, px } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';
import Countdown from '@/components/Countdown';
import Accordion from '@/components/Accordion';
import Newsletter from '@/components/Newsletter';
import Stars from '@/components/Stars';
import type { FeaturedReviews, StoreContent } from '@/lib/types';
import ShortName from '@/components/ShortName';

const TRUST: [string, string, string][] = [
  ['COD', 'Cash on Delivery', 'Pay at your doorstep'],
  ['64', 'Nationwide Delivery', 'All 64 districts'],
  ['৳', 'bKash & Nagad', 'Secure mobile payment'],
  ['7d', 'Easy Exchange', 'Within 7 days'],
];

/** "Up to *25% off* runners" → "Up to <em>25% off</em> runners" (staff highlight words with stars). */
function highlighted(title: string): ReactNode[] {
  return title.split(/\*([^*]+)\*/).map((part, i) => (i % 2 ? <em key={i}>{part}</em> : part));
}

export default async function HomePage() {
  const [content, categories, all, bestsellers, newArrivals, reviews] = await Promise.all([
    getContent(),
    getCategories(),
    listProducts({ limit: 100 }),
    listProducts({ section: 'bestsellers' }),
    listProducts({ section: 'new-arrivals' }),
    // The reviews strip is left out if it can't load, rather than failing the whole homepage.
    getFeaturedReviews().catch((): FeaturedReviews | null => null),
  ]);
  const products = all.items;
  // Discounted products first, then other tagged ones, then the newest to fill the four tiles.
  const picks = [
    ...products.filter((p) => p.compareAtPrice),
    ...products.filter((p) => !p.compareAtPrice && p.tag),
    ...newArrivals.items,
  ]
    .filter((p, i, all) => all.findIndex((x) => x.slug === p.slug) === i)
    .slice(0, 4);
  const { hero, promos, faq } = content;
  const countdown = hero.countdownEnds && new Date(hero.countdownEnds) > new Date() ? hero.countdownEnds : null;

  // Each homepage section; staff choose the order and which ones show (admin → Content).
  const sections: Record<StoreContent['sections'][number]['key'], () => ReactNode> = {
    hero: () => (
      <section className="hero2" key="hero">
        <div className="container hero2-grid">
          <div className="hero2-main">
            {hero.eyebrow && <div className="eyebrow">{hero.eyebrow}</div>}
            <h1>{highlighted(hero.title)}</h1>
            {hero.text && <p>{hero.text}</p>}
            {countdown && <Countdown end={countdown} />}
            <div className="hero2-actions">
              <Link className="btn btn-primary" href={hero.primary.href}>
                {hero.primary.label}
              </Link>
              {hero.secondary && (
                <Link className="btn btn-outline" href={hero.secondary.href}>
                  {hero.secondary.label}
                </Link>
              )}
            </div>
          </div>
          <div className="hero2-side">
            {picks.map((p) => (
              <Link className="pick" key={p.slug} href={productHref(p.slug)}>
                <div className="pick-img" style={p.image ? bg(imgSrc(p.image.url, 600)) : undefined}>
                  {p.compareAtPrice && (
                    <span className="pick-off">-{Math.round((1 - p.price / p.compareAtPrice) * 100)}%</span>
                  )}
                </div>
                <div className="pick-body">
                  <b>
                    <ShortName name={p.name} />
                  </b>
                  <span>
                    ৳{fmt(p.price)}
                    {p.compareAtPrice && <s>৳{fmt(p.compareAtPrice)}</s>}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    ),
    trust: () => (
      <section className="trust home-band" key="trust">
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
    ),
    categories: () => (
      <section className="container home-block" key="categories">
        <h2 className="h2" style={{ marginBottom: 24 }}>
          Shop by Category
        </h2>
        <div className="grid-cats">
          {categories.map((c) => (
            <Link className="cat-tile" key={c.slug} href={catHref(c.slug)}>
              <div className="cat-img" style={c.imageUrl ? bg(imgSrc(c.imageUrl)) : undefined} />
              <div className="cat-body">
                <b>{c.name}</b>
                <small>{c.productCount} products</small>
              </div>
            </Link>
          ))}
        </div>
      </section>
    ),
    bestsellers: () =>
      bestsellers.items.length > 0 && (
        <section className="container home-block" key="bestsellers">
          <div className="section-head">
            <h2 className="h2">Best Sellers</h2>
            <Link className="link-btn" href="/shop">
              View all →
            </Link>
          </div>
          <div className="grid-products">
            {bestsellers.items.map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
        </section>
      ),
    promos: () =>
      promos.length > 0 && (
        <section className="container home-block" key="promos">
          <div className="promos">
            {promos.map((t, i) => (
              <div className="promo" key={i} style={bg(imgSrc(t.imageUrl, 1200))}>
                <div className="promo-body">
                  {t.tag && <span className={`promo-tag ${t.tagStyle === 'red' ? 'red' : ''}`}>{t.tag}</span>}
                  <h3>{t.title}</h3>
                  {t.text && <p>{t.text}</p>}
                  <Link className="btn btn-white" href={t.href}>
                    {t.buttonLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ),
    'new-arrivals': () =>
      newArrivals.items.length > 0 && (
        <section className="container home-block" key="new-arrivals">
          <div className="section-head">
            <h2 className="h2">New Arrivals</h2>
            <Link className="link-btn" href="/shop">
              View all →
            </Link>
          </div>
          <div className="grid-products">
            {newArrivals.items.map((p) => (
              <ProductCard key={p.slug} p={p} forceNew />
            ))}
          </div>
        </section>
      ),
    budget: () => (
      <section className="container home-block" key="budget">
        <h2 className="h2" style={{ marginBottom: 24 }}>
          Shop by Budget
        </h2>
        <div className="grid-budget">
          {[1000, 2000, 3000, 5000].map((a) => (
            <Link className="budget" key={a} href={`/shop?max=${a}&sort=low`}>
              <small>Under</small>
              <strong>৳{fmt(a)}</strong>
              <span>{products.filter((p) => p.price < a).length} products →</span>
            </Link>
          ))}
        </div>
      </section>
    ),
    story: () => (
      <section className="story home-band" key="story">
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
    ),
    reviews: () =>
      reviews &&
      reviews.items.length > 0 && (
        <section className="container home-block" key="reviews">
          <div className="section-head">
            <h2 className="h2">What Our Customers Say</h2>
            {reviews.average !== null && (
              <span className="muted">
                ★ {reviews.average.toFixed(1)} average from {reviews.count.toLocaleString('en-US')} review
                {reviews.count === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <div className="grid-reviews">
            {reviews.items.slice(0, 3).map((r) => (
              <div className="review" key={r.id}>
                <Stars rating={r.rating} size={16} />
                <p>“{r.body.length > 220 ? r.body.slice(0, 217).trimEnd() + '…' : r.body}”</p>
                <div className="review-by">
                  <span className="avatar">{r.name[0]}</span>
                  <div>
                    <b>{r.name}</b>
                    <small>
                      {r.city ? `${r.city} · ` : ''}Verified buyer ·{' '}
                      <Link href={productHref(r.product.slug)}>
                        <ShortName name={r.product.name} />
                      </Link>
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ),
    faq: () =>
      faq.length > 0 && (
        <section className="faq-wrap" id="faq" key="faq">
          <h2 className="h2">Frequently Asked Questions</h2>
          <Accordion items={faq.map((f): [string, string] => [f.q, f.a])} />
        </section>
      ),
    newsletter: () => (
      <section className="container home-block" key="newsletter">
        <Newsletter />
      </section>
    ),
  };

  return <div className="home">{content.sections.filter((s) => s.visible).map((s) => sections[s.key]())}</div>;
}
