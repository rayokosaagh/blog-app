// src/lib/blogSort.ts
//
// Pure sort vocabulary for the blog listing. Deliberately NOT in the
// "use client" component file: every export of a "use client" module becomes a
// client reference when a Server Component imports it, so `parseSort` would
// arrive at src/app/blog/page.tsx as an uncallable proxy rather than a function.

export type SortKey = "newest" | "oldest" | "popular";

export const DEFAULT_SORT: SortKey = "newest";

export const SORT_KEYS: SortKey[] = ["newest", "oldest", "popular"];

/** Narrows an arbitrary query string to a known sort key. */
export function parseSort(value: string | undefined | null): SortKey {
  return SORT_KEYS.includes(value as SortKey) ? (value as SortKey) : DEFAULT_SORT;
}
