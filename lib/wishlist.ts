'use client';

import { useCallback, useSyncExternalStore } from 'react';

// The wishlist lives in this browser only (there are no customer accounts): a list of product
// slugs in localStorage, newest first. Other tabs follow along through the "storage" event.
const KEY = 'bunon-wishlist';
const MAX = 50; // the API looks up at most 50 slugs at once
const EMPTY: string[] = [];

let cache: { raw: string | null; list: string[] } = { raw: null, list: EMPTY };
const listeners = new Set<() => void>();

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY; // storage blocked (private mode, settings)
  }
  if (raw === cache.raw) return cache.list;
  let list: string[] = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed))
      list = parsed.filter((s): s is string => typeof s === 'string' && /^[a-z0-9-]{1,200}$/.test(s)).slice(0, MAX);
  } catch {
    // ignore a damaged value
  }
  cache = { raw, list };
  return list;
}

function write(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    // storage full or blocked: the heart just won't stay on
  }
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => e.key === KEY && onChange();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function useWishlist() {
  const slugs = useSyncExternalStore(subscribe, read, () => EMPTY);
  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);
  const toggle = useCallback((slug: string) => {
    const now = read();
    const next = now.includes(slug) ? now.filter((s) => s !== slug) : [slug, ...now];
    write(next);
    return next.includes(slug);
  }, []);
  const remove = useCallback((slug: string) => write(read().filter((s) => s !== slug)), []);
  return { slugs, has, toggle, remove };
}
