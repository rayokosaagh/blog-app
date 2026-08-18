"use client";

/**
 * A `useSyncExternalStore`-compatible view over one localStorage key.
 *
 * localStorage is exactly the "external system" that hook exists for, and
 * going through it rather than reading into state inside an effect buys three
 * things: no hydration mismatch (the server snapshot is a stable constant), no
 * cascading render on mount, and every component reading the same key stays in
 * sync — including across tabs, via the `storage` event.
 *
 * The identity caching below is not optional. `getSnapshot` must return the
 * *same reference* until the underlying value actually changes; parsing fresh
 * JSON on every call returns a new array each time, which React reads as an
 * endless stream of changes and throws "getSnapshot should be cached".
 */
export interface LocalStore<T> {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (next: T) => void;
  update: (fn: (prev: T) => T) => void;
}

export function createLocalStore<T>(
  key: string,
  parse: (raw: string | null) => T,
  /** Returned during SSR and on the first client render. Must be a constant. */
  empty: T
): LocalStore<T> {
  let cachedRaw: string | null | undefined;
  let cachedValue: T = empty;

  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  function readRaw(): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null; // private mode / storage disabled
    }
  }

  function getSnapshot(): T {
    const raw = readRaw();
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedValue = parse(raw);
    }
    return cachedValue;
  }

  function subscribe(onChange: () => void) {
    listeners.add(onChange);
    // Fires only for writes from *other* tabs, which is why `set` emits too.
    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) onChange();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onStorage);
    };
  }

  function set(next: T) {
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* quota exceeded — the in-memory value below still updates for this session */
    }
    cachedRaw = readRaw();
    cachedValue = next;
    emit();
  }

  return {
    subscribe,
    getSnapshot,
    getServerSnapshot: () => empty,
    set,
    update: (fn) => set(fn(getSnapshot())),
  };
}
