"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  description: string | null;
  badge: string | null;
  cta: string | null;
  featuredLabel: string | null;
  image: string;
  link: string;
}

// Neon palette the card cycles through on hover — lime, cyan, magenta/pink.
const HOVER_ACCENTS = ["#c6ff33", "#22d3ee", "#ff2ec4"];

/**
 * CNET-style hero: a large carousel image on the left with an attached
 * title/description card on the right, joined inside one bordered unit.
 * A single `current` index drives BOTH halves, so advancing the banner
 * swaps the image AND the headline/description card in lockstep. Stacks
 * (image over card) on mobile.
 */
export default function HeroSpotlight({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  // A random neon accent applied to the card while hovered (null = theme default).
  const [hoverAccent, setHoverAccent] = useState<string | null>(null);

  const go = useCallback(
    (dir: number) => {
      setDirection(dir);
      setCurrent((prev) => (prev + dir + banners.length) % banners.length);
    },
    [banners.length]
  );

  const next = useCallback(() => go(1), [go]);
  const prev = useCallback(() => go(-1), [go]);

  // Auto-advance every 6s.
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (banners.length === 0) return null;

  const b = banners[current];

  const imageVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div className="flex flex-col overflow-hidden surface-border shadow-brutal-lg lg:flex-row">
      {/* Hero image (left / top) */}
      {/* aspect-video below lg instead of a fixed h-56/h-72. Banner artwork is
          16:9 and routinely has the product name set into the image; a 340x224
          box (1.52:1) cropped ~15% off each side with `object-cover`, slicing
          that lettering off. Matching the source ratio shows the full artwork.
          Fixed height returns at lg, where the hero sits beside the text card. */}
      <div className="relative aspect-video w-full overflow-hidden bg-border lg:aspect-auto lg:h-[30rem] lg:flex-[3]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={b.id}
            custom={direction}
            variants={imageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Link
              href={b.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full w-full"
            >
              <img
                src={b.image}
                alt={b.title}
                className="h-full w-full object-cover"
              />
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Featured flag — label is per-banner, editable on the banners
            dashboard page; falls back to "Featured" when left blank. */}
        <span className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 surface-border bg-accent px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-on-accent shadow-brutal-sm">
          <Sparkles className="h-3.5 w-3.5" />
          {b.featuredLabel?.trim() || "Featured"}
        </span>
      </div>

      {/* Attached title / description card (right / bottom).
          Hovering rolls a random neon accent (lime/cyan/pink) by overriding
          the card background — button, headline hover, dots recolor via
          group-hover/card in both brutalist and modern mode. */}
      <div
        onMouseEnter={() =>
          setHoverAccent(
            HOVER_ACCENTS[Math.floor(Math.random() * HOVER_ACCENTS.length)]
          )
        }
        onMouseLeave={() => setHoverAccent(null)}
        style={hoverAccent ? { backgroundColor: hoverAccent } : undefined}
        className="group/card flex w-full flex-col border-t border-border-heavy bg-card p-6 transition-colors duration-300 sm:p-8 lg:w-[22rem] lg:border-l lg:border-t-0 xl:w-[26rem]"
      >
        <span className="mb-4 inline-flex w-fit items-center gap-1.5 surface-border bg-accent px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-on-accent transition-colors duration-300 group-hover/card:bg-black group-hover/card:text-white">
          {b.badge?.trim() || "Top Story"}
        </span>

        {/* Headline + description swap in sync with the image.
            Deliberately NOT `flex-1`: stretching this block pushed the CTA to
            the bottom of the card, so a banner saved without a description
            (the "Summer sale" one) rendered as a headline, ~250px of void, then
            a button. The controls row below carries `mt-auto` instead, so it
            still pins to the bottom while the text and CTA stay together. */}
        <div className="min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link href={b.link} target="_blank" rel="noopener noreferrer">
                <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground transition-colors duration-300 group-hover/card:text-black sm:text-3xl">
                  {b.title}
                </h2>
              </Link>
              {b.description && (
                <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover/card:text-black/80 sm:text-base">
                  {b.description}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <Link
          href={b.link}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-6 inline-flex w-fit items-center gap-2 surface-border bg-accent-2 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-on-accent-2 shadow-brutal-sm brutal-press transition-colors duration-300 group-hover/card:bg-black group-hover/card:text-white"
        >
          {b.cta?.trim() || "Read more"}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>

        {/* Shared controls — arrows, dots and counter drive the whole unit */}
        {banners.length > 1 && (
          <div className="mt-auto flex items-center justify-between border-t border-border-heavy pt-4">
            {/* The dots were 10x10 hit areas — under the 24x24 WCAG 2.2
                minimum and painful on a phone. The button is now a 24px-tall
                target with horizontal padding; the visible bar is an inner
                span, so the dot looks identical but the tappable area is not. */}
            <div className="flex items-center">
              {banners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setDirection(i > current ? 1 : -1);
                    setCurrent(i);
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === current ? "true" : undefined}
                  className="flex h-6 items-center px-2"
                >
                  <span
                    style={{ width: i === current ? "24px" : "10px" }}
                    className={`block h-2.5 surface-border-w border-border-heavy transition-all ${
                      i === current
                        ? "bg-accent-2 group-hover/card:bg-black"
                        : "bg-background group-hover/card:bg-black/20"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tabular-nums text-muted-foreground transition-colors duration-300 group-hover/card:text-black">
                {String(current + 1).padStart(2, "0")}
                <span className="text-border-heavy group-hover/card:text-black/40"> / </span>
                {String(banners.length).padStart(2, "0")}
              </span>
              <button
                onClick={prev}
                aria-label="Previous"
                className="flex h-8 w-8 items-center justify-center surface-border bg-background text-foreground shadow-brutal-sm transition-colors duration-300 brutal-press group-hover/card:bg-black group-hover/card:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={next}
                aria-label="Next"
                className="flex h-8 w-8 items-center justify-center surface-border bg-background text-foreground shadow-brutal-sm transition-colors duration-300 brutal-press group-hover/card:bg-black group-hover/card:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}