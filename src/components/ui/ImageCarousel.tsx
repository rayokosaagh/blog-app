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
        {/* Header */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Images className="h-4 w-4 shrink-0 text-accent" />
            <span className="truncate text-sm font-extrabold uppercase tracking-wide text-foreground">
              {title || "Gallery"}
            </span>
          </div>
          {counter}
        </div>

        {/* Stage — the bordered frame shrink-wraps each image, so any aspect
            ratio fits exactly: no letterbox bars, no cropping. */}
        <div className="flex justify-center">
          <div
            tabIndex={0}
            role="group"
            aria-roledescription="carousel"
            aria-label={alt || title || "Image gallery"}
            onKeyDown={onKeyNav}
            className="group relative inline-block max-w-full select-none rounded-none shadow-brutal focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <motion.img
              key={index}
              src={src}
              alt={label(index)}
              initial={{ opacity: 0.35 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="block h-[360px] w-auto max-w-full rounded-none border-2 border-border-heavy bg-white object-contain sm:h-[460px] lg:h-[540px]"
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
