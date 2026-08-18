"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Scrolls to the top when the route changes.
 *
 * Next 16's <Link> default is documented as "maintain scroll position … as long
 * as the Page is visible in the viewport", and it only scrolls when the new
 * Page element is NOT in the viewport. Every page on this site renders a
 * full-height wrapper starting at the top of the document, so that element
 * always intersects the viewport — Next concludes nothing needs scrolling and
 * leaves you wherever you were. Reading half of /blog and opening an article
 * dropped you into the middle of it.
 *
 * `scroll={true}` cannot fix this; it IS the default that produces it. So the
 * reset is explicit here.
 *
 * Three cases deliberately skipped:
 *  - Back/forward. A popstate navigation should restore the previous position,
 *    which is what a reader expects from the browser buttons. The listener runs
 *    before the pathname state settles, so the flag is always set in time.
 *  - URLs carrying a hash, so deep links land on their target instead of the
 *    top. In-page #anchors keep the same pathname and never reach this effect;
 *    SmoothAnchors owns those.
 *  - The first render, so a hard load with a hash is not yanked to the top.
 *
 * Keyed on pathname only, NOT searchParams: filter and sort links (/blog?sort=,
 * /products?category=) are same-page state changes where holding position is
 * correct — BlogSort already passes scroll={false} for exactly that reason.
 */
export default function ScrollTopOnNavigate() {
  const pathname = usePathname();
  const cameFromHistory = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const onPopState = () => {
      cameFromHistory.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (cameFromHistory.current) {
      cameFromHistory.current = false;
      return;
    }
    if (window.location.hash) return;

    // "instant", not the default: globals.css has no scroll-behavior: smooth,
    // but a future change to it should not turn every navigation into a glide.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
