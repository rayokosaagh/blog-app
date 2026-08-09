"use client";

import { useEffect } from "react";

// Matches TocSidebar's SCROLL_OFFSET so every in-page jump on the site lands
// the target in the same place, clear of the sticky masthead.
const HEADER_OFFSET = 100;

/**
 * Smooth scrolling for plain `<a href="#id">` links, done in JS instead of via
 * `scroll-behavior: smooth` on <html>.
 *
 * That CSS rule looked equivalent but had a bad side effect: Next's App Router
 * scrolls to the top of each new page with a bare `domNode.scrollIntoView()`,
 * which honours the CSS value. So every route change animated a scroll instead
 * of jumping — arriving on a product or compare page from a scrolled-down
 * listing visibly slid the page upward each time.
 *
 * Handling it here scopes smoothness to actual anchor clicks, leaves
 * navigation instant, and fixes a second problem the CSS never addressed:
 * native anchor jumps ignore the sticky header and land the target underneath
 * it. Components that already manage their own scrolling (TocSidebar, JumpNav)
 * call preventDefault, so they're skipped.
 */
export default function SmoothAnchors() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Let modified clicks (new tab/window) and self-managed links through.
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href === "#" || !href.startsWith("#")) return;
      if (anchor.getAttribute("target") === "_blank") return;

      let id: string;
      try {
        id = decodeURIComponent(href.slice(1));
      } catch {
        id = href.slice(1);
      }

      const el = document.getElementById(id);
      if (!el) return; // nothing to scroll to — leave it to the browser

      e.preventDefault();

      // Brutalist deliberately stays snappy; only modern glides. Read at click
      // time rather than render time, so there's nothing to hydrate.
      const isModern = document.documentElement.dataset.theme === "modern";
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET,
        behavior: isModern && !reduced ? "smooth" : "instant",
      });

      // Keep the hash in the URL without triggering a second native jump.
      window.history.replaceState(null, "", href);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
