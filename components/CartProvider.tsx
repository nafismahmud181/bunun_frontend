'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '@/lib/api/client';
import { parseSavedCart, refreshCart } from '@/lib/cart';
import type { CartItem, CartLine, CartSnapshot, Order } from '@/lib/types';
import CartDrawer from './CartDrawer';

interface CartContextValue {
  lines: CartLine[];
  subtotal: number;
  count: number;
  add: (sku: string, qty: number, snapshot: CartSnapshot) => void;
  changeQty: (sku: string, d: number) => void;
  remove: (sku: string) => void;
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
      setCart(parseSavedCart(JSON.parse(localStorage.getItem('bunon_cart') || '[]')));
    } catch {}
    try {
      setLastOrder(JSON.parse(sessionStorage.getItem('bunon_last_order') || 'null'));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem('bunon_cart', JSON.stringify(cart));
  }, [cart, ready]);

  // Once the saved cart is loaded, refresh prices and names from the API and drop items that
  // are no longer for sale. If the API is unreachable, the saved copy is kept.
  const [refreshed, setRefreshed] = useState(false);
  useEffect(() => {
    if (!ready || refreshed) return;
    const skus = cart.map((c) => c.sku);
    if (!skus.length) return;
    const ctrl = new AbortController();
    api
      .GET('/api/v1/variants', { params: { query: { skus: skus.join(',') } }, signal: ctrl.signal })
      .then(({ data }) => {
        if (data) setCart((c) => refreshCart(c, data));
        setRefreshed(true);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [ready, refreshed, cart]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const add = (sku: string, qty: number, snapshot: CartSnapshot) =>
    setCart((c) => {
      const ex = c.find((x) => x.sku === sku);
      return ex
        ? c.map((x) => (x.sku === sku ? { ...x, qty: x.qty + qty, snapshot } : x))
        : [...c, { sku, qty, snapshot }];
    });
  const changeQty = (sku: string, d: number) =>
    setCart((c) => c.map((x) => (x.sku === sku ? { ...x, qty: Math.max(1, x.qty + d) } : x)));
  const remove = (sku: string) => setCart((c) => c.filter((x) => x.sku !== sku));
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

  // Items converted from an old cart have no snapshot until the API refresh fills it in.
  const lines: CartLine[] = cart.filter((c) => c.snapshot.name).map((c) => ({ ...c, total: c.snapshot.price * c.qty }));
  const subtotal = lines.reduce((a, l) => a + l.total, 0);
  const count = lines.reduce((a, l) => a + l.qty, 0);

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
