"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import OptimizedImage from "@/components/ui/OptimizedImage";

export interface AdCarouselItem {
  id: string;
  title: string;
  image: string;
  link: string;
}

/**
 * Edge-to-edge artwork in a themed card, with controls below the image.
 * Shares the hero grid's row height on desktop and mobile. On desktop the
 * row sets its width from the height at the ad artwork's 1070x1470 ratio
 * (see the hero row in app/page.tsx), so ads uploaded at that size show
 * whole; other ratios are cropped by object-cover.
 *
 * Whole card is a link to the current ad. Pauses while hovered or focused,
 * never autoplays under prefers-reduced-motion, and the dots are real buttons
 * so a keyboard user can pick a slide. `interval` is ms between slides.
 */
export default function AdCarousel({
  ads,
  interval = 5000,
}: {
  ads: AdCarouselItem[];
  interval?: number;
}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (ads.length <= 1 || paused || reduceMotion) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % ads.length), interval);
    return () => clearInterval(t);
  }, [ads.length, paused, reduceMotion, interval]);

  if (ads.length === 0) return null;
  const ad = ads[current];
  const external = /^https?:\/\//.test(ad.link);

  return (
    <aside
      aria-label="Sponsored"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="relative h-full min-h-[23rem] min-w-0 text-foreground sm:min-h-[28rem] lg:min-h-0"
    >
      <div className="absolute inset-0 overflow-hidden surface-border border-border-heavy bg-card shadow-brutal">
        <Link
          href={ad.link}
          {...(external ? { target: "_blank", rel: "noopener noreferrer sponsored" } : {})}
          aria-label={ad.title}
          className="group absolute inset-0 block"
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={ad.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <OptimizedImage
                src={ad.image}
                alt={ad.title}
                fill
                sizes="(min-width: 1024px) 440px, 100vw"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </Link>
      </div>
      {ads.length > 1 && (
        <div
          className="absolute inset-x-0 top-full mt-2 flex items-center justify-center overflow-x-auto"
          role="group"
          aria-label="Ads"
        >
          {ads.map((a, i) => (
            <button
              key={a.id}
              type="button"
              aria-pressed={i === current}
              aria-label={`Ad ${i + 1}: ${a.title}`}
              onClick={() => setCurrent(i)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-accent"
            >
              <span className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-accent" : "w-2 bg-muted-foreground/50"}`} />
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
