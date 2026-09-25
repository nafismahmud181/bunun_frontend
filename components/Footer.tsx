import Link from 'next/link';
import { STORE as S } from '@/lib/store';
import { catHref } from '@/lib/utils';

export default function Footer() {
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
          {S.categories.map((c) => (
            <Link key={c} href={catHref(c)}>
              {c}
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
