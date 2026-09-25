'use client';

import Link from 'next/link';
import { Suspense, useState, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { STORE as S } from '@/lib/store';
import { catHref, fmt } from '@/lib/utils';
import { useCart } from './CartProvider';

const Icon = {
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  user: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
  heart: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
    </svg>
  ),
  bag: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  ),
  menu: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
};

function SearchForm({ initial = '' }: { initial?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  // Reset the box when the URL's ?q= changes (e.g. back/forward), without an effect.
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setQ(initial);
  }
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    router.push('/shop' + (v ? '?q=' + encodeURIComponent(v) : ''));
  };
  return (
    <form className="search" onSubmit={submit}>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search for table runners, cushion covers, jute décor…"
      />
      <button type="submit" aria-label="Search">
        {Icon.search}
        <span>Search</span>
      </button>
    </form>
  );
}

function SearchWithParams() {
  const pathname = usePathname();
  const sp = useSearchParams();
  return <SearchForm initial={pathname === '/shop' ? sp.get('q') || '' : ''} />;
}

function NavList({ isActive }: { isActive?: (label: string) => boolean }) {
  const items: [string, string][] = [
    ['Home', '/'],
    ['All Products', '/shop'],
    ...S.categories.map((c): [string, string] => [c, catHref(c)]),
  ];
  return (
    <div className="nav-links">
      {items.map(([label, href]) => (
        <Link key={href} href={href} className={`nav-link ${isActive?.(label) ? 'active' : ''}`}>
          {label}
        </Link>
      ))}
    </div>
  );
}

function NavWithParams() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const onShop = pathname === '/shop';
  const cat = sp.get('cat');
  const isActive = (label: string) => {
    if (label === 'Home') return pathname === '/';
    if (label === 'All Products') return onShop && !cat && !sp.get('max') && !sp.get('q');
    return onShop && cat === label;
  };
  return <NavList isActive={isActive} />;
}

export default function Header() {
  const { count, subtotal, setOpen } = useCart();
  return (
    <>
      <div className="topbar">
        <div className="container">
          <span>Free delivery over ৳{fmt(S.freeShipAt)} · Cash on Delivery in all 64 districts</span>
          <span className="topbar-links">
            <span>Hotline: 09612-345678</span>
            <Link href="/">Track Order</Link>
            <Link href="/">Help</Link>
            <Link href="/">বাংলা</Link>
          </span>
        </div>
      </div>

      <header className="site-header">
        <div className="header-bar">
          <div className="container header-main">
            <Link className="logo" href="/">
              <span className="logo-mark">B</span>
              <span className="logo-text">
                <span className="logo-name">Bunon</span>
                <span className="logo-sub">Handcrafted Home Décor</span>
              </span>
            </Link>
            <Suspense fallback={<SearchForm />}>
              <SearchWithParams />
            </Suspense>
            <div className="header-actions">
              <Link className="h-action" href="/">
                <span className="h-icon">{Icon.user}</span>
                <span className="h-label">
                  <small>Hello, Sign in</small>
                  <b>Account</b>
                </span>
              </Link>
              <Link className="h-action" href="/">
                <span className="h-icon">{Icon.heart}</span>
                <span className="h-label">
                  <small>Saved</small>
                  <b>Wishlist</b>
                </span>
              </Link>
              <button className="h-action cart-btn" onClick={() => setOpen(true)}>
                <span className="h-icon">
                  {Icon.bag}
                  <span className="cart-count">{count}</span>
                </span>
                <span className="h-label">
                  <small>My Cart</small>
                  <b>৳{fmt(subtotal)}</b>
                </span>
              </button>
            </div>
          </div>
        </div>
        <nav className="main-nav">
          <div className="container nav-row">
            <Link className="all-cats" href="/shop">
              {Icon.menu}
              <span>All Categories</span>
            </Link>
            <Suspense fallback={<NavList />}>
              <NavWithParams />
            </Suspense>
            <Link className="nav-deal" href="/shop?max=2000&sort=low">
              Festive Deals
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
}
