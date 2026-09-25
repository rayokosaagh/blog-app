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
      className="relative h-full min-h-[23rem] w-full overflow-hidden surface-border border-border-heavy bg-photo-overlay text-on-photo shadow-brutal sm:min-h-[28rem] lg:min-h-0"
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
          swallow its clicks. They exist so white copy stays readable on ANY
          artwork — bright, busy banners (a sunlit beach, a white product
          shot) washed the title out under the old 20–40% fade.
          Phones: the copy spans nearly the full width, so a sideways fade
          can't cover it; an even tint does. From sm up the copy sits in the
          bottom-left corner (slides are bottom-aligned), so the shade is a
          radial fade from that corner: dark behind the copy, clear across the
          top-left and the right side of the artwork.
          Sized to the copy block, which is ~55% of the width and ~60% of the
          height: taller than wide, and strong enough that the description's
          far end still sits on ~50% shade (at 30% it washed out over the
          Summer sale art's painted lettering). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-photo-overlay/50 sm:bg-transparent sm:bg-[radial-gradient(ellipse_120%_150%_at_0%_100%,color-mix(in_srgb,var(--photo-overlay)_82%,transparent)_0%,color-mix(in_srgb,var(--photo-overlay)_62%,transparent)_40%,color-mix(in_srgb,var(--photo-overlay)_35%,transparent)_62%,transparent_85%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-photo-overlay/45 via-photo-overlay/5 to-transparent sm:from-photo-overlay/25" />

      {/* pointer-events-none so the artwork link underneath stays clickable
          across the whole banner; the interactive children opt back in. */}
      <div className="pointer-events-none relative z-10 flex h-full min-h-[inherit] flex-col justify-between p-5 sm:p-8 lg:p-7">
        {/* All slides share one grid cell and reserve the tallest copy's space.
            Inactive slides stay out of the accessibility and keyboard trees.
            self-end: shorter slides sit at the BOTTOM of that cell, so the
            description and button land in the same spot on every slide (just
            above the dots) however long the title is. Top-aligned, a one-line
            title left them floating high over the artwork. */}
        {/* mt-auto: any spare height (the desktop row is sized to the
            screen, not to the copy) collects ABOVE the copy, keeping it in
            the shaded bottom-left corner right over the slide controls. */}
        <div className="mt-auto grid min-w-0 max-w-xl">
          {banners.map((slide, index) => (
            <div
              key={slide.id}
              aria-hidden={index !== current}
              inert={index !== current}
              className={`col-start-1 row-start-1 min-w-0 self-end ${index === current ? "visible" : "invisible"}`}
            >
              {slide.badge && (
                <span className="h-eyebrow inline-flex surface-pill border-border-heavy bg-accent px-3 py-1.5 text-on-accent">
                  {slide.badge}
                </span>
              )}
              {/* Title size also tracks the desktop row height (--hero-h, set by the
                  hero row in app/page.tsx): three lines of title at 1.05
                  line-height plus the rest of the slide (~19.75rem) must fit the
                  row. Below lg --hero-h is unset and the fallback keeps that
                  term out of the way. line-clamp-3 bounds long titles; it
                  clips at the last line box, which at 1.05 leading cut off
                  descenders (the g/p of "Flagship"), so pb-[0.12em] gives
                  them room and the divisor counts it (3 x 1.05 + 0.12). */}
              <h2 className="h-display mt-3 line-clamp-3 max-w-[18ch] pb-[0.12em] text-balance break-words [text-shadow:0_2px_16px_rgb(0_0_0/0.35)] sm:mt-4 lg:mt-3" style={{ fontSize: "min(var(--h-display-size), clamp(1.75rem, 6vw, 3.75rem), max(1.75rem, calc((var(--hero-h, 100rem) - 19.75rem) / 3.27)))" }}>
                {slide.title}
              </h2>
              {slide.description && (
                <p className="mt-4 line-clamp-3 max-w-lg lg:mt-3 text-pretty text-sm leading-relaxed text-on-photo [text-shadow:0_1px_10px_rgb(0_0_0/0.45)] sm:text-base">
                  {slide.description}
                </p>
              )}
              <Link
                href={slide.link}
                {...(/^https?:\/\//.test(slide.link) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group pointer-events-auto mt-5 inline-flex min-h-11 max-w-full items-center gap-2 surface-pill border-border-heavy bg-accent px-5 py-2.5 text-sm font-extrabold text-on-accent shadow-brutal-sm brutal-press sm:mt-6 lg:mt-4"
              >
                <span className="min-w-0 break-words">{slide.cta?.trim() || "Learn more"}</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 pt-4 sm:pt-8 lg:pt-4">

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
                    className="flex h-11 w-11 items-center justify-center rounded-full lg:h-8 lg:w-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-photo"
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
