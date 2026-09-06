"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

export interface HeroBannerItem {
  id: string;
  title: string;
  description: string | null;
  badge: string | null;
  cta: string | null;
  image: string;
  link: string;
}

const AUTOPLAY_MS = 6000;

/**
 * Homepage hero: a full-bleed banner carousel with the copy laid over the
 * artwork (badge, headline, description, CTA) and a slide
 * counter.
 *
 * Everything on the photo uses the fixed on-photo tokens (white ink over a
 * dark scrim) so it reads identically in every theme; only the outer shell
 * takes the theme's border/radius/shadow.
 */
export default function HeroBanner({
  banners,
}: {
  banners: HeroBannerItem[];
}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  // Stable mount-time decision for the LCP image (see HeroSpotlight for why
  // this can't be `current === 0`).
  const [isInitialSlide, setIsInitialSlide] = useState(true);
  const reduceMotion = useReducedMotion();

  const goTo = useCallback(
    (i: number) => {
      setIsInitialSlide(false);
      setCurrent(((i % banners.length) + banners.length) % banners.length);
    },
    [banners.length]
  );

  useEffect(() => {
    if (banners.length <= 1 || paused || reduceMotion) return;
    const t = setInterval(() => goTo(current + 1), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [banners.length, paused, reduceMotion, current, goTo]);

  if (banners.length === 0) return null;
  const b = banners[current];
  const external = /^https?:\/\//.test(b.link);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="relative h-full min-h-[26rem] w-full overflow-hidden surface-border border-border-heavy bg-photo-overlay text-on-photo shadow-brutal-lg lg:min-h-[30rem]"
    >
      {/* Artwork — cross-fades between slides, and is itself the link to the
          banner's destination. It is a SIBLING of the copy layer, not a parent:
          the copy contains the CTA link and the slide buttons, and an <a>
          inside an <a> is invalid. tabIndex -1 because the CTA already exposes
          this exact destination to keyboard and screen-reader users — a second
          stop on the same href would just be noise. */}
      <Link
        href={b.link}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        aria-label={b.title}
        tabIndex={-1}
        className="absolute inset-0 z-0"
      >
      <AnimatePresence initial={false}>
        <motion.div
          key={b.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={b.image}
            alt=""
            fill
            sizes="(min-width: 1600px) 1200px, (min-width: 1024px) calc(100vw - 22rem), 100vw"
            priority={isInitialSlide}
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>
      </Link>

      {/* Scrims are decorative and sit over the artwork link, so they must not
          swallow its clicks. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-photo-overlay/85 via-photo-overlay/45 to-photo-overlay/10"
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1/2 bg-gradient-to-t from-photo-overlay/70 to-transparent" />

      {/* pointer-events-none so the artwork link underneath stays clickable
          across the whole banner; the interactive children opt back in. */}
      <div className="pointer-events-none relative z-10 flex h-full min-h-[inherit] flex-col justify-between p-6 sm:p-8 lg:p-10">
        <div className="max-w-xl">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
            >
              {b.badge && (
                <span className="inline-flex items-center gap-1.5 surface-pill border-border-heavy bg-accent px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-on-accent shadow-brutal-sm">
                  <Zap className="h-3.5 w-3.5" fill="currentColor" />
                  {b.badge}
                </span>
              )}
              <h2 className="mt-4 text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
                {b.title}
              </h2>
              {b.description && (
                <p className="mt-3 line-clamp-2 max-w-md text-sm leading-relaxed text-on-photo/80 sm:text-base">
                  {b.description}
                </p>
              )}
              <Link
                href={b.link}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group pointer-events-auto mt-6 inline-flex items-center gap-2 surface-pill border-border-heavy bg-accent px-5 py-2.5 text-sm font-extrabold text-on-accent shadow-brutal-sm brutal-press"
              >
                {b.cta?.trim() || "Learn more"}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex flex-col gap-4">

          {banners.length > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tabular-nums text-on-photo/80">
                {String(current + 1).padStart(2, "0")} / {String(banners.length).padStart(2, "0")}
              </span>
              <div className="pointer-events-auto flex items-center gap-1.5" role="tablist" aria-label="Slides">
                {banners.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={i === current}
                    aria-label={`Slide ${i + 1}: ${s.title}`}
                    onClick={() => goTo(i)}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === current ? "w-6 bg-on-photo" : "w-3 bg-on-photo/40 hover:bg-on-photo/70"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </section>
  );
}
