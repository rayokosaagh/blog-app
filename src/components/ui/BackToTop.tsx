"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// Distance-aware duration: a short hop shouldn't take as long as a full-page
// haul, and a very long article shouldn't crawl. Still "quick and decisive"
// rather than a long soft glide.
const MIN_MS = 320;
const MAX_MS = 700;
const MS_PER_PX = 0.35;

/**
 * Rubber-band the page on arrival, the way a native overscroll does.
 *
 * It has to be a transform rather than more scrolling: scrollY can't go below
 * 0, and scrolling *down* to fake it would move the content the wrong way (up
 * instead of down), which reads as a stutter rather than a bounce.
 *
 * Scoped to <main> — transforming <body> or <html> would make it the
 * containing block for every `position: fixed` descendant and shift the navbar
 * and this button along with it. Sticky elements inside <main> are unaffected
 * in practice because this only ever runs at scrollY 0, where nothing is stuck
 * yet. The Web Animations API is used over a CSS class because it composites
 * off the main thread and leaves no lingering transform to clean up (fill
 * defaults to "none").
 */
function bounceAtTop() {
  const main = document.querySelector("main");
  if (!main || typeof main.animate !== "function") return;

  main.animate(
    [
      { transform: "translateY(0)" },
      { transform: "translateY(12px)", offset: 0.35 },
      { transform: "translateY(-3px)", offset: 0.72 },
      { transform: "translateY(0)" },
    ],
    { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  );
}

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const frameRef = useRef<number | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    // Coalesce to one read per frame — scroll fires far more often than that,
    // and each handler call reads window.scrollY (a layout-flushing property).
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setVisible(window.scrollY > 600);
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    const start = window.scrollY;
    if (start <= 0) return;

    if (reduced) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }

    // A second click mid-flight restarts cleanly instead of leaving two loops
    // fighting over scrollTop.
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

    const duration = Math.min(MAX_MS, Math.max(MIN_MS, start * MS_PER_PX));
    const startTime = performance.now();

    // Hand control back the moment the reader takes over. Continuing to drive
    // scrollTop against a wheel or touch gesture is the other thing that makes
    // scroll-to-top feel like it's stuttering.
    let cancelled = false;
    const abort = () => {
      cancelled = true;
    };
    // Registered during the click, which lands after the tap's own touchstart,
    // so a mobile tap doesn't immediately cancel itself.
    window.addEventListener("wheel", abort, { passive: true, once: true });
    window.addEventListener("touchstart", abort, { passive: true, once: true });

    const cleanup = () => {
      window.removeEventListener("wheel", abort);
      window.removeEventListener("touchstart", abort);
      frameRef.current = null;
    };

    const step = (now: number) => {
      if (cancelled) {
        cleanup();
        return;
      }

      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic

      // `behavior: "instant"` is load-bearing. The modern theme sets
      // `scroll-behavior: smooth` on <html>, and the default "auto" defers to
      // that CSS value — so every frame would start its own native smooth
      // animation toward a slightly different target, ~60 of them a second,
      // each interrupting the last. That collision is the jank. "instant"
      // bypasses the CSS entirely and lets this loop do the easing.
      window.scrollTo({ top: Math.round(start * (1 - eased)), behavior: "instant" });

      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        cleanup();
        // Only on a completed trip — a run the reader interrupted shouldn't
        // bounce, and neither should a click when already at the top.
        bounceAtTop();
      }
    };

    frameRef.current = requestAnimationFrame(step);
  }, [reduced]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-12 h-12 rounded-none
                     bg-accent text-on-accent border-2 border-border-heavy
                     shadow-brutal brutal-press"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
