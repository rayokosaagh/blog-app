"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js, and only in production.
 *
 * Under `next dev` a service worker intercepts the HMR and RSC requests
 * Turbopack relies on, which produces stale modules and "failed to fetch"
 * overlays that look like app bugs. It also unregisters any worker left behind
 * from a previous production build on the same origin (localhost, typically),
 * so a developer who ran `next start` once doesn't spend an afternoon
 * debugging a cached bundle.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => undefined);
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    };

    // Registering during load competes with the page's own critical requests.
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
