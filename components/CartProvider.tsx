'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { STORE as S } from '@/lib/store';
import { byId, unitPrice } from '@/lib/utils';
import type { CartItem, CartLine, Order } from '@/lib/types';
import CartDrawer from './CartDrawer';

interface CartContextValue {
  lines: CartLine[];
  subtotal: number;
  count: number;
  add: (id: string, size: number, qty: number) => void;
  changeQty: (key: string, d: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  showToast: (msg: string) => void;
  lastOrder: Order | null;
  saveOrder: (order: Order) => void;
}

const CartContext = createContext<CartContextValue | null>(null);
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
};

export default function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Browser storage is read after mount so the server HTML and the first client render match.
  // Phase 2 replaces this with the server cart.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCart(JSON.parse(localStorage.getItem('bunon_cart') || '[]'));
    } catch {}
    try {
      setLastOrder(JSON.parse(sessionStorage.getItem('bunon_last_order') || 'null'));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem('bunon_cart', JSON.stringify(cart));
  }, [cart, ready]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const add = (id: string, size: number, qty: number) =>
    setCart((c) => {
      const key = id + '|' + size;
      const ex = c.find((x) => x.key === key);
      return ex ? c.map((x) => (x.key === key ? { ...x, qty: x.qty + qty } : x)) : [...c, { key, id, size, qty }];
    });
  const changeQty = (key: string, d: number) =>
    setCart((c) => c.map((x) => (x.key === key ? { ...x, qty: Math.max(1, x.qty + d) } : x)));
  const remove = (key: string) => setCart((c) => c.filter((x) => x.key !== key));
  const clear = () => setCart([]);

  const showToast = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  };

  const saveOrder = (order: Order) => {
    setLastOrder(order);
    sessionStorage.setItem('bunon_last_order', JSON.stringify(order));
  };

  const lines = cart
    .map((c): CartLine | null => {
      const p = byId(c.id);
      if (!p) return null;
      return { ...c, p, sizeLabel: S.sizes[p.cat]?.[c.size] ?? '', total: unitPrice(p, c.size) * c.qty };
    })
    .filter((l): l is CartLine => l !== null);
  const subtotal = lines.reduce((a, l) => a + l.total, 0);
  const count = cart.reduce((a, c) => a + c.qty, 0);

  const value: CartContextValue = {
    lines,
    subtotal,
    count,
    add,
    changeQty,
    remove,
    clear,
    open,
    setOpen,
    showToast,
    lastOrder,
    saveOrder,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
      {toast && <div className="toast">{toast}</div>}
    </CartContext.Provider>
  );
}
