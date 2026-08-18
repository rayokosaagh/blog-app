"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { createLocalStore } from "@/lib/localStore";

export interface CompareItem {
  slug: string;
  name: string;
  brand: string;
  image: string | null;
  /** Gadget category slug — the tray can only ever hold one category's worth. */
  categorySlug: string;
}

// Matches GadgetCategoryDef.maxCompare, which every category currently sets to
// 3. Hard-coded rather than imported because the tray is mounted app-wide and
// has no category definition to consult until something is in it.
export const MAX_COMPARE = 3;

const STORAGE_KEY = "compare-tray-v1";

interface CompareTrayValue {
  items: CompareItem[];
  has: (slug: string) => boolean;
  /** False when the tray is full, or already holds a different category. */
  canAdd: (categorySlug: string) => boolean;
  toggle: (item: CompareItem) => void;
  remove: (slug: string) => void;
  clear: () => void;
  /** The category the tray is locked to, or null when empty. */
  category: string | null;
  /** URL for the current selection, or null with fewer than two picks. */
  compareHref: string | null;
}

const CompareTrayContext = createContext<CompareTrayValue | null>(null);

function parse(raw: string | null): CompareItem[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed
      .filter(
        (i): i is CompareItem =>
          i && typeof i.slug === "string" && typeof i.categorySlug === "string"
      )
      .slice(0, MAX_COMPARE);
  } catch {
    return EMPTY; // corrupt storage — start clean rather than throw
  }
}

// Shared constant, not a fresh []: it is the server snapshot, and
// useSyncExternalStore requires that to be reference-stable.
const EMPTY: CompareItem[] = [];

const store = createLocalStore(STORAGE_KEY, parse, EMPTY);

export default function CompareTrayProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  const category = items[0]?.categorySlug ?? null;

  const has = useCallback((slug: string) => items.some((i) => i.slug === slug), [items]);

  const canAdd = useCallback(
    (categorySlug: string) =>
      items.length < MAX_COMPARE && (category === null || category === categorySlug),
    [items.length, category]
  );

  const toggle = useCallback((item: CompareItem) => {
    store.update((prev) => {
      if (prev.some((i) => i.slug === item.slug))
        return prev.filter((i) => i.slug !== item.slug);
      // Guarded in the UI too, but a stale render could still get here.
      if (prev.length >= MAX_COMPARE) return prev;
      if (prev.length > 0 && prev[0].categorySlug !== item.categorySlug) return prev;
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((slug: string) => {
    store.update((prev) => prev.filter((i) => i.slug !== slug));
  }, []);

  const clear = useCallback(() => store.set(EMPTY), []);

  const compareHref = useMemo(() => {
    if (items.length < 2 || !category) return null;
    const params = new URLSearchParams({ category });
    items.forEach((i, idx) => params.set(`p${idx + 1}`, i.slug));
    return `/compare?${params.toString()}`;
  }, [items, category]);

  const value = useMemo(
    () => ({ items, has, canAdd, toggle, remove, clear, category, compareHref }),
    [items, has, canAdd, toggle, remove, clear, category, compareHref]
  );

  return <CompareTrayContext.Provider value={value}>{children}</CompareTrayContext.Provider>;
}

export function useCompareTray(): CompareTrayValue {
  const ctx = useContext(CompareTrayContext);
  if (!ctx) throw new Error("useCompareTray must be used inside CompareTrayProvider");
  return ctx;
}
