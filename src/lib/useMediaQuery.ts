"use client";

import { useSyncExternalStore } from "react";

/**
 * Reactive `window.matchMedia` — true while `query` matches.
 *
 * useSyncExternalStore rather than useState + useEffect: the eslint config
 * treats "set state inside an effect" as an error (see AGENTS.md), and this is
 * exactly the external-store shape the hook exists for. The server snapshot
 * is `false`, so SSR renders the small-screen branch and the client corrects
 * on hydration; callers should only use it for behaviour (which values to
 * animate to), not for markup that would mismatch.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
