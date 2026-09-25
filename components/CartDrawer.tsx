'use client';

import { useRouter } from 'next/navigation';
import { STORE as S } from '@/lib/store';
import { bg, fmt, imgSrc } from '@/lib/utils';
import { useCart } from './CartProvider';

export default function CartDrawer() {
  const { open, setOpen, lines, subtotal, count, changeQty, remove, showToast } = useCart();
  const router = useRouter();
  if (!open) return null;

  const pct = Math.min(100, Math.round((subtotal / S.freeShipAt) * 100));
  const goCheckout = () => {
    if (!lines.length) return showToast('Your cart is empty');
    setOpen(false);
    router.push('/checkout');
  };

  return (
    <div className="drawer">
      <div className="drawer-backdrop" onClick={() => setOpen(false)} />
      <aside className="drawer-panel">
        <div className="drawer-head">
          <span>Shopping Cart ({count})</span>
          <button className="drawer-close" onClick={() => setOpen(false)} aria-label="Close">
            ×
          </button>
        </div>
        <div className="ship-bar">
          <div>
            {subtotal >= S.freeShipAt
              ? 'You have unlocked FREE delivery!'
              : `Add ৳${fmt(S.freeShipAt - subtotal)} more for free delivery`}
          </div>
          <div className="bar">
            <div style={{ width: pct + '%' }} />
          </div>
        </div>
        <div className="drawer-items">
          {lines.length === 0 && <div className="empty">Your cart is empty.</div>}
          {lines.map((l) => (
            <div className="line-item" key={l.sku}>
              <div className="line-img" style={l.snapshot.image ? bg(imgSrc(l.snapshot.image, 300)) : undefined} />
              <div>
                <b>{l.snapshot.name}</b>
                <small>{l.snapshot.label}</small>
                <div className="line-qty">
                  <button onClick={() => changeQty(l.sku, -1)} aria-label="Decrease">
                    −
                  </button>
                  <span>{l.qty}</span>
                  <button onClick={() => changeQty(l.sku, 1)} aria-label="Increase">
                    +
                  </button>
                  <button className="remove" onClick={() => remove(l.sku)}>
                    Remove
                  </button>
                </div>
              </div>
              <div className="line-total">৳{fmt(l.total)}</div>
            </div>
          ))}
        </div>
        <div className="drawer-foot">
          <div className="sum-line">
            <span>Subtotal</span>
            <span>৳{fmt(subtotal)}</span>
          </div>
          <button className="btn btn-primary" onClick={goCheckout}>
            Proceed to Checkout
          </button>
          <button
            className="btn btn-outline"
            onClick={() => setOpen(false)}
            style={{ height: 44, padding: 0, fontSize: 14 }}
          >
            Continue Shopping
          </button>
        </div>
      </aside>
    </div>
  );
}
