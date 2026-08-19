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
 * Auto-cycling ad rail beside the homepage hero: one bordered card that fades
 * through the HeroAd images on a fixed interval. The image is the entire card
 * — object-cover, edge to edge, nothing drawn over or beside it — and the slide
 * indicator sits outside, under the card. The slot is 320 css px wide and as
 * tall as the hero (~480px, 2:3), so a 640×960 portrait upload shows with no
 * crop at all; other ratios are centre-cropped to fill.
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
      className="relative flex h-full flex-col"
    >
      {/* The card is nothing but the image. Portrait box below lg (the rail
          stacks under the hero there); from lg it flexes to fill whatever the
          indicator leaves of the row height beside the hero. */}
      {/* lg:h-full, not lg:flex-1: as a flex child the card gave up whatever
          height the indicator needed, leaving it ~18px shorter than the hero
          banner it sits beside. Now it takes the full row height and matches
          the hero exactly, and the indicator is positioned out of flow below. */}
      <div className="relative aspect-[2/3] w-full overflow-hidden surface-border border-border-heavy bg-card shadow-brutal lg:aspect-auto lg:h-full lg:min-h-0">
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
                sizes="(min-width: 1024px) 320px, 100vw"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </Link>
      </div>

      {/* Indicator lives outside the card, below it — inside, it ate a strip of
          the image and put a rule across the ad. */}
      {ads.length > 1 && (
        <div
          className="mt-3 flex shrink-0 items-center justify-center gap-1.5 lg:absolute lg:inset-x-0 lg:top-full lg:mt-3"
          role="tablist"
          aria-label="Ads"
        >
          {ads.map((a, i) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`Ad ${i + 1}: ${a.title}`}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-6 bg-accent" : "w-2.5 bg-border-heavy/60 hover:bg-border-heavy"
              }`}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
