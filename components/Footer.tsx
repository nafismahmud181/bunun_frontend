import Link from 'next/link';
import { catHref } from '@/lib/utils';
import type { Category } from '@/lib/types';

export default function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="site-footer">
      <div className="container footer-cols">
        <div>
          <div className="footer-brand">Bunon</div>
          <span>House 12, Road 5, Dhanmondi, Dhaka 1205</span>
          <span>support@bunon.com.bd</span>
          <span>09612-345678 (10am–8pm)</span>
        </div>
        <div>
          <h4>Shop</h4>
          {categories.map((c) => (
            <Link key={c.slug} href={catHref(c.slug)}>
              {c.name}
            </Link>
          ))}
        </div>
        <div>
          <h4>Customer Care</h4>
          <Link href="/">Delivery Information</Link>
          <Link href="/">Return &amp; Exchange Policy</Link>
          <Link href="/">Track Your Order</Link>
          <Link href="/#faq">FAQ</Link>
        </div>
        <div>
          <h4>We Accept</h4>
          <div className="pay-badges">
            {['bKash', 'Nagad', 'Visa', 'Mastercard', 'COD'].map((b) => (
              <span key={b}>{b}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Bunon. All rights reserved.</span>
        <span>Trade License No. TRAD/DNCC/000000/2026</span>
      </div>
    </footer>
  );
}
