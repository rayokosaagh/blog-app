"use client";

import { useCallback, useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, Images } from "lucide-react";
import Lightbox from "@/components/ui/Lightbox";

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  title?: string;
  className?: string;
}

const SWIPE_THRESHOLD = 60; // px of drag needed to change slide
const EASE = [0.22, 1, 0.36, 1] as const;

const navBtn =
  "z-10 flex items-center justify-center rounded-none border-2 border-border-heavy bg-accent text-on-accent shadow-brutal-sm brutal-press";

/**
 * Cinematic image gallery: a header (title + counter), a stage that fills the
 * letterbox area with a blurred copy of the current photo, accent side arrows,
 * and a thumbnail rail. Fully navigable — swipe/drag, keyboard arrows (when the
 * frame is focused), thumbnails, and a full-screen lightbox. Shared by the
 * product page and the blog `[gallery]` block. Plain <img> because sources are
 * arbitrary upload/external URLs.
 */
export default function ImageCarousel({ images, alt = "", title, className = "" }: ImageCarouselProps) {
  const clean = images.filter((u) => typeof u === "string" && u.trim() !== "");
  const count = clean.length;

  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + count) % count),
    [count]
  );
  const goTo = useCallback((target: number) => setIndex(target), []);

  const onKeyNav = useCallback(
    (e: React.KeyboardEvent) => {
      if (count < 2) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    },
    [go, count]
  );

  if (count === 0) return null;

  const src = clean[index];
  const label = (i: number) =>
    alt ? `${alt} — image ${i + 1} of ${count}` : `Image ${i + 1} of ${count}`;

  function handleDragEnd(_e: unknown, info: PanInfo) {
    if (count < 2) return;
    if (info.offset.x < -SWIPE_THRESHOLD) go(1);
    else if (info.offset.x > SWIPE_THRESHOLD) go(-1);
  }

  const counter = (
    <span className="shrink-0 rounded-none border-2 border-border-heavy bg-foreground px-2 py-0.5 text-xs font-extrabold tabular-nums text-background">
      {index + 1} / {count}
    </span>
  );

  return (
    <div className={className}>
      <div className="rounded-none border-2 border-border-heavy bg-card p-3 shadow-brutal sm:p-4">
        {/* Header — the label only appears when a caller actually supplies a
            title. It used to fall back to a hardcoded "Gallery", which just
            restated what the block obviously is. With no title the counter
            sits alone on the right. */}
        <div
          className={`mb-3 flex items-center gap-3 ${
            title ? "justify-between" : "justify-end"
          }`}
        >
          {title && (
            <div className="flex min-w-0 items-center gap-2">
              <Images className="h-4 w-4 shrink-0 text-accent" />
              <span className="truncate text-sm font-extrabold uppercase tracking-wide text-foreground">
                {title}
              </span>
            </div>
          )}
          {counter}
        </div>

        {/* Stage — a FIXED box: always the full column width, always the same
            height. It used to be `inline-block` shrink-wrapping a `w-auto`
            image, which meant the frame's width was `height x that photo's
            aspect ratio` — so a portrait shot produced a narrow frame and a
            landscape one a wide frame. Two visible bugs fell out of that: every
            image rendered at a different size, and the arrows (anchored
            `left-3` / `right-3` to the frame) jumped horizontally on every
            navigation. Pinning the box makes both stable.

            The photo is `object-contain` inside it, so nothing is ever cropped;
            the leftover letterbox area is filled by a blurred, dimmed copy of
            the same photo — which is what this component's docstring described
            all along but was never actually implemented. */}
        <div
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label={alt || title || "Image gallery"}
          onKeyDown={onKeyNav}
          className="group relative h-[360px] w-full select-none overflow-hidden rounded-none border-2 border-border-heavy bg-card shadow-brutal focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:h-[460px] lg:h-[540px]"
        >
          {/* Letterbox fill. Purely decorative, so it's hidden from assistive
              tech and never intercepts the drag/click handlers below. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={`bg-${index}`}
            src={src}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-2xl"
          />

          <motion.img
            key={index}
            src={src}
            alt={label(index)}
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="absolute inset-0 z-[1] h-full w-full object-contain"
            draggable={false}
            drag={count > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            style={{ cursor: count > 1 ? "grab" : "default" }}
          />

          <button
            type="button"
            onClick={() => setLightbox(true)}
            aria-label="View full screen"
            className={`${navBtn} absolute right-3 top-3 h-9 w-9 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100`}
          >
            <Expand className="h-4 w-4" />
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous image"
                className={`${navBtn} absolute left-3 top-1/2 h-11 w-11 -translate-y-1/2`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next image"
                className={`${navBtn} absolute right-3 top-1/2 h-11 w-11 -translate-y-1/2`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail rail */}
        {count > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {clean.map((thumb, i) => (
              <button
                key={`${thumb}-${i}`}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                className={`h-14 w-14 shrink-0 overflow-hidden rounded-none border-2 bg-white transition-all duration-100 sm:h-16 sm:w-16 ${
                  i === index
                    ? "border-accent"
                    : "border-border-heavy opacity-50 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumb} alt="" className="h-full w-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full-screen viewer — shared brutalist lightbox (zoom / pan / download) */}
      <Lightbox
        src={lightbox ? src : null}
        title={title || "Gallery"}
        onClose={() => setLightbox(false)}
        counter={count > 1 ? `${index + 1} / ${count}` : undefined}
        onPrev={count > 1 ? () => go(-1) : undefined}
        onNext={count > 1 ? () => go(1) : undefined}
      />
    </div>
  );
}
