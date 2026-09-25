"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
      className="relative h-full min-h-[23rem] w-full overflow-hidden surface-border border-border-heavy bg-photo-overlay text-on-photo shadow-brutal sm:min-h-[28rem] lg:min-h-[32rem]"
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-photo-overlay/20 via-photo-overlay/5 to-transparent"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-photo-overlay/45 via-photo-overlay/5 to-transparent" />

      {/* pointer-events-none so the artwork link underneath stays clickable
          across the whole banner; the interactive children opt back in. */}
      <div className="pointer-events-none relative z-10 flex h-full min-h-[inherit] flex-col justify-between p-5 sm:p-8 lg:p-10">
        <div className="mb-5 flex items-center gap-3 sm:mb-8">
          <span aria-hidden="true" className="h-0.5 w-8 bg-accent" />
          <span className="h-eyebrow text-on-photo/90">In the spotlight</span>
        </div>
        {/* All slides share one grid cell and reserve the tallest copy's space.
            Inactive slides stay out of the accessibility and keyboard trees. */}
        <div className="mt-auto grid min-w-0 max-w-2xl">
          {banners.map((slide, index) => (
            <div
              key={slide.id}
              aria-hidden={index !== current}
              inert={index !== current}
              className={`col-start-1 row-start-1 min-w-0 ${index === current ? "visible" : "invisible"}`}
            >
              {slide.badge && (
                <span className="h-eyebrow inline-flex surface-pill border-border-heavy bg-accent px-3 py-1.5 text-on-accent">
                  {slide.badge}
                </span>
              )}
              <h2 className="h-display mt-3 max-w-[18ch] text-balance break-words sm:mt-4" style={{ fontSize: "min(var(--h-display-size), clamp(1.75rem, 6vw, 3.75rem))" }}>
                {slide.title}
              </h2>
              {slide.description && (
                <p className="mt-4 line-clamp-3 max-w-lg text-pretty text-sm leading-relaxed text-on-photo/85 sm:text-base">
                  {slide.description}
                </p>
              )}
              <Link
                href={slide.link}
                {...(/^https?:\/\//.test(slide.link) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group pointer-events-auto mt-5 inline-flex min-h-11 max-w-full items-center gap-2 surface-pill border-border-heavy bg-accent px-5 py-2.5 text-sm font-extrabold text-on-accent shadow-brutal-sm brutal-press sm:mt-6"
              >
                <span className="min-w-0 break-words">{slide.cta?.trim() || "Learn more"}</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:mt-8">

          {banners.length > 1 && (
            <div className="flex flex-wrap items-center gap-3 border-t border-on-photo/20 pt-3">
              <span className="text-xs font-bold tabular-nums text-on-photo/80">
                {String(current + 1).padStart(2, "0")} / {String(banners.length).padStart(2, "0")}
              </span>
              <div className="pointer-events-auto flex flex-wrap items-center" role="group" aria-label="Slides">
                {banners.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={i === current}
                    aria-label={`Slide ${i + 1}: ${s.title}`}
                    onClick={() => goTo(i)}
                    className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-photo"
                  >
                    <span className={`h-1 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-on-photo" : "w-2 bg-on-photo/50"}`} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </section>
  );
}
