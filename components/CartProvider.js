'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { STORE as S } from '@/lib/store';
import { byId, unitPrice } from '@/lib/utils';
import CartDrawer from './CartDrawer';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

export default function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [lastOrder, setLastOrder] = useState(null);
  const toastTimer = useRef();

  useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem('bunon_cart') || '[]')); } catch {}
    try { setLastOrder(JSON.parse(sessionStorage.getItem('bunon_last_order') || 'null')); } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem('bunon_cart', JSON.stringify(cart));
  }, [cart, ready]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const add = (id, size, qty) =>
    setCart((c) => {
      const key = id + '|' + size;
      const ex = c.find((x) => x.key === key);
      return ex ? c.map((x) => (x.key === key ? { ...x, qty: x.qty + qty } : x)) : [...c, { key, id, size, qty }];
    });
  const changeQty = (key, d) => setCart((c) => c.map((x) => (x.key === key ? { ...x, qty: Math.max(1, x.qty + d) } : x)));
  const remove = (key) => setCart((c) => c.filter((x) => x.key !== key));
  const clear = () => setCart([]);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  };

  const saveOrder = (order) => {
    setLastOrder(order);
    sessionStorage.setItem('bunon_last_order', JSON.stringify(order));
  };

  const lines = cart
    .map((c) => {
      const p = byId(c.id);
      if (!p) return null;
      return { ...c, p, sizeLabel: S.sizes[p.cat][c.size], total: unitPrice(p, c.size) * c.qty };
    })
    .filter(Boolean);
  const subtotal = lines.reduce((a, l) => a + l.total, 0);
  const count = cart.reduce((a, c) => a + c.qty, 0);

  const value = { lines, subtotal, count, add, changeQty, remove, clear, open, setOpen, showToast, lastOrder, saveOrder };

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
      {toast && <div className="toast">{toast}</div>}
    </CartContext.Provider>
  );
}
