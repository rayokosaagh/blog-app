"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface PageTransitionProps {
  children: React.ReactNode;
}

// Expo-out: quick to start, long bounce-free settle.
const EASE = [0.22, 1, 0.36, 1] as const;
const DURATION = 0.34;

/**
 * Cross-fade between routes.
 *
 * Deliberately opacity-only — no slide, scale or blur. This wrapper contains
 * the whole page, including the sticky <Navbar>, the fixed BackToTop button and
 * the sticky sidebars. `transform` and `filter` both make an element the
 * containing block for its `position: fixed` descendants — the same trap
 * already documented in PopupAd, which had to portal out to <body> because of
 * it. Animating either one detaches those elements for the duration of every
 * navigation, so the navbar unsticks and slides along with the page. The
 * previous slide-in on `x` did exactly that.
 *
 * Opacity creates a stacking context but NOT a containing block, so the fade
 * composites on the GPU and leaves layout completely alone. `mode="popLayout"`
 * pulls the outgoing page out of flow so the two don't stack and briefly
 * double the document height mid-transition.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={reduced ? { duration: 0 } : { duration: DURATION, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
