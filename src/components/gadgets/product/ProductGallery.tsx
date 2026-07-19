"use client";

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import Lightbox from "@/components/ui/Lightbox";

const arrow =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-none border-2 border-border-heavy bg-accent text-on-accent shadow-brutal-sm brutal-press disabled:opacity-40";

/**
 * Compact product-hero gallery: a main image with navigation arrows beside it
 * and a thumbnail rail below. Click (or the expand button) opens the shared
 * neo-brutalist <Lightbox />. Falls back to a single static image / empty state.
 */
export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const clean = images.filter((u) => typeof u === "string" && u.trim() !== "");
  const count = clean.length;
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + count) % count),
    [count]
  );

  const boxClass =
    "flex h-52 w-52 items-center justify-center rounded-none border-2 border-border-heavy bg-white p-4 sm:h-60 sm:w-60";

  if (count === 0) {
    return (
      <div className={`${boxClass} mx-auto lg:mx-0`}>
        <span className="text-xs text-muted-foreground">No image</span>
      </div>
    );
  }

  const src = clean[index];

  return (
    <div className="mx-auto shrink-0 lg:mx-0">
      {/* Main image with arrows beside it */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {count > 1 && (
          <button type="button" onClick={() => go(-1)} aria-label="Previous image" className={arrow}>
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div className={`group relative ${boxClass}`}>
          <button
            type="button"
            onClick={() => setLightbox(true)}
            aria-label="View full screen"
            className="block h-full w-full cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="h-full w-full object-contain" />
          </button>

          <span className="pointer-events-none absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-none border-2 border-border-heavy bg-card text-foreground opacity-0 shadow-brutal-sm transition-opacity duration-150 group-hover:opacity-100">
            <Expand className="h-3.5 w-3.5" />
          </span>

          {count > 1 && (
            <span className="absolute bottom-2 left-2 rounded-none border-2 border-border-heavy bg-foreground px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums text-background">
              {index + 1} / {count}
            </span>
          )}
        </div>

        {count > 1 && (
          <button type="button" onClick={() => go(1)} aria-label="Next image" className={arrow}>
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Thumbnail rail below */}
      {count > 1 && (
        <div className="scrollbar-hide mt-3 flex justify-center gap-2 overflow-x-auto pb-1">
          {clean.map((thumb, i) => (
            <button
              key={`${thumb}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              className={`h-12 w-12 shrink-0 overflow-hidden rounded-none border-2 bg-white transition-all duration-100 ${
                i === index ? "border-accent" : "border-border-heavy opacity-50 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb} alt="" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}

      <Lightbox
        src={lightbox ? src : null}
        title={alt}
        onClose={() => setLightbox(false)}
        counter={count > 1 ? `${index + 1} / ${count}` : undefined}
        onPrev={count > 1 ? () => go(-1) : undefined}
        onNext={count > 1 ? () => go(1) : undefined}
      />
    </div>
  );
}
