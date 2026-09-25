'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '@/lib/api/client';
import { parseSavedCart } from '@/lib/cart';
import type { Cart, CartLine, LastOrder, StoreSettings } from '@/lib/types';
import CartDrawer from './CartDrawer';

// The cart lives on the server (Phase 2). The browser keeps only the cart's token.
const TOKEN_KEY = 'bunon_cart_token';
// Carts saved in the browser before the server cart existed; moved to the server once.
const LEGACY_CART_KEY = 'bunon_cart';
const LAST_ORDER_KEY = 'bunon_last_order';

interface CartContextValue {
  settings: StoreSettings;
  lines: CartLine[];
  subtotal: number;
  count: number;
  /** The cart token, for checkout. */
  token: string | null;
  /** Adds units of a variant; resolves to false (after showing why) if it couldn't. */
  add: (sku: string, qty: number) => Promise<boolean>;
  changeQty: (sku: string, d: number) => void;
  remove: (sku: string) => void;
  /** Re-reads the cart after a server action (e.g. checkout emptied it). */
  reload: () => Promise<void>;
  open: boolean;
  setOpen: (open: boolean) => void;
  showToast: (msg: string) => void;
  lastOrder: LastOrder | null;
  saveOrder: (order: LastOrder) => void;
}

const CartContext = createContext<CartContextValue | null>(null);
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
};

const EMPTY: Cart = { items: [], itemCount: 0, subtotal: 0 };
const readStorage = (key: string, store: 'local' | 'session' = 'local') => {
  try {
    return (store === 'local' ? localStorage : sessionStorage).getItem(key);
  } catch {
    return null;
  }
};
const NETWORK_ERROR = 'Could not reach the store. Please check your connection.';

export default function CartProvider({ children, settings }: { children: ReactNode; settings: StoreSettings }) {
  const [cart, setCart] = useState<Cart>(EMPTY);
  const [token, setToken] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }, []);

  // Applies a cart response, remembering the token when the server has just created the cart.
  const apply = useCallback((next: Cart) => {
    if (next.token) {
      tokenRef.current = next.token;
      setToken(next.token);
      try {
        localStorage.setItem(TOKEN_KEY, next.token);
      } catch {}
    }
    setCart(next);
  }, []);

  const headers = () => (tokenRef.current ? { 'x-cart-token': tokenRef.current } : undefined);

  const reload = useCallback(async () => {
    if (!tokenRef.current) return setCart(EMPTY);
    const { data } = await api.GET('/api/v1/cart', { headers: { 'x-cart-token': tokenRef.current } });
    if (data) setCart(data);
  }, []);

  // Browser storage is read after mount so the server HTML and the first client render match.
  useEffect(() => {
    const saved = readStorage(TOKEN_KEY);
    tokenRef.current = saved;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(saved);
    try {
      setLastOrder(JSON.parse(readStorage(LAST_ORDER_KEY, 'session') || 'null'));
    } catch {}

    (async () => {
      // Move a cart saved by the old storefront onto the server, then forget it.
      let legacy: ReturnType<typeof parseSavedCart> = [];
      try {
        legacy = parseSavedCart(JSON.parse(readStorage(LEGACY_CART_KEY) || '[]'));
      } catch {}
      for (const item of legacy) {
        const { data } = await api.POST('/api/v1/cart/items', {
          headers: tokenRef.current ? { 'x-cart-token': tokenRef.current } : undefined,
          body: { sku: item.sku, qty: Math.min(item.qty, 20) },
        });
        if (data) apply(data);
      }
      try {
        localStorage.removeItem(LEGACY_CART_KEY);
      } catch {}
      await reload();
    })().catch(() => {});
  }, [apply, reload]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const add = async (sku: string, qty: number) => {
    try {
      const { data, error } = await api.POST('/api/v1/cart/items', { headers: headers(), body: { sku, qty } });
      if (data) {
        apply(data);
        return true;
      }
      showToast(error?.message ?? 'Could not add to cart');
    } catch {
      showToast(NETWORK_ERROR);
    }
    return false;
  };

  const setQty = async (sku: string, qty: number) => {
    try {
      const { data, error } = await api.PUT('/api/v1/cart/items/{sku}', {
        headers: headers(),
        params: { path: { sku } },
        body: { qty },
      });
      if (data) apply(data);
      else showToast(error?.message ?? 'Could not update the cart');
    } catch {
      showToast(NETWORK_ERROR);
    }
  };

  const changeQty = (sku: string, d: number) => {
    const line = cart.items.find((l) => l.sku === sku);
    if (line) void setQty(sku, Math.max(1, line.qty + d));
  };
  const remove = (sku: string) => void setQty(sku, 0);

  const saveOrder = (order: LastOrder) => {
    setLastOrder(order);
    try {
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
    } catch {}
  };

  const value: CartContextValue = {
    settings,
    lines: cart.items,
    subtotal: cart.subtotal,
    count: cart.itemCount,
    token,
    add,
    changeQty,
    remove,
    reload,
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
