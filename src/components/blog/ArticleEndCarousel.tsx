"use client";

import { useRef, useState, type ReactNode } from "react";

export interface ArticleEndSlide {
  key: string;
  /** Tab label on the swipeable layout. */
  label: string;
  /** Column on wide screens: the article column, or the gutter to either side. */
  place: "left" | "center" | "right";
  node: ReactNode;
}

/**
 * The block right after an article: the verdict, flanked by the linked
 * product's spec card (left) and the trending list (right).
 *
 * From 1440px — the width where the article page's ToC and spotlight rails
 * appear — side cards always sit in the gutters, never in the article column:
 *
 * - With a verdict, it is a three-column grid whose side tracks use the same
 *   width formula as `.article-rail`, so the centre column lands exactly on
 *   the article's 896px column. A grid rather than absolute positioning so the
 *   row is as tall as its tallest card; an absolute side card taller than the
 *   verdict would spill over the poll below.
 * - Without one there is nothing to put in the centre, and a grid row would
 *   leave an empty band as tall as the trending list. So the section collapses
 *   to zero height and the side cards hang in the gutters beside the poll and
 *   rating, which only use the article column.
 *
 * Narrower than 1440 there is no gutter, so the cards go in the article
 * column: several become a horizontal scroll-snap carousel with tabs, each
 * slide centred on the column and the next one peeking in; a single card just
 * sits there.
 */
export default function ArticleEndCarousel({ slides }: { slides: ArticleEndSlide[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (slides.length === 0) return null;

  const hasCenter = slides.some((s) => s.place === "center");
  const isCarousel = slides.length > 1;

  // Whichever slide's centre is nearest the track's centre is the active tab.
  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDistance = Infinity;
    Array.from(track.children).forEach((el, i) => {
      const slide = el as HTMLElement;
      const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - mid);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    setActive(best);
  }

  function goTo(i: number) {
    const track = trackRef.current;
    const slide = track?.children[i] as HTMLElement | undefined;
    if (!track || !slide) return;
    track.scrollTo({
      left: slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2,
      behavior: "smooth",
    });
  }

  // Below 1440: a full-bleed scroll-snap track. Each slide is exactly the
  // article column's width and the side padding centres it, so every slide
  // snaps onto the article column and the next one peeks in from the gap.
  // In cqw of the section rather than vw (which on desktop Windows includes
  // the scrollbar). 100cqw is the section's CONTENT box — the page minus its
  // 2 x 1.5rem padding — so the slide is min(100cqw, 56rem), like the
  // article, and the track (pulled out to full bleed) is 100cqw + 3rem.
  const trackBase = isCarousel
    ? "scrollbar-hide relative -mx-6 flex items-start snap-x snap-mandatory gap-4 overflow-x-auto px-[calc((100cqw+3rem-min(100cqw,56rem))/2)] pb-4 pt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    : "mx-auto max-w-4xl";
  const trackWide = hasCenter
    ? "article-end-grid min-[1440px]:mx-0 min-[1440px]:grid min-[1440px]:max-w-none min-[1440px]:items-stretch min-[1440px]:overflow-visible min-[1440px]:p-0"
    : "min-[1440px]:static min-[1440px]:mx-0 min-[1440px]:block min-[1440px]:max-w-none min-[1440px]:overflow-visible min-[1440px]:p-0";

  const GRID_COLUMN = { left: "min-[1440px]:col-start-1", center: "min-[1440px]:col-start-2", right: "min-[1440px]:col-start-3" };
  const GUTTER = { left: "min-[1440px]:left-6", center: "", right: "min-[1440px]:right-6" };

  return (
    <section
      aria-label="More on this article"
      className={`@container relative mx-auto my-10 w-full max-w-[1720px] px-6 ${hasCenter ? "" : "min-[1440px]:my-0 min-[1440px]:h-0"}`}
    >
      <style>{`
        /* Side tracks: the same width formula as .article-rail (see the
           article page), so 2 x rail + 2 x 32px gap + 896px = the container's
           inner width and the middle track is exactly the article column. */
        @media (min-width: 1440px) {
          .article-end-grid {
            grid-template-columns:
              min(340px, calc((min(100vw, 1720px) - 944px) / 2 - 32px))
              minmax(0, 56rem)
              min(340px, calc((min(100vw, 1720px) - 944px) / 2 - 32px));
            justify-content: center;
            column-gap: 32px;
          }
          .article-end-gutter {
            width: min(340px, calc((min(100vw, 1720px) - 944px) / 2 - 32px));
          }
        }
      `}</style>

      {isCarousel && (
        <div className="mb-4 flex justify-center min-[1440px]:hidden">
          <div className="inline-flex overflow-hidden rounded-md border-[1.5px] border-border-heavy bg-card">
            {slides.map((slide, i) => (
              <button
                key={slide.key}
                type="button"
                onClick={() => goTo(i)}
                aria-current={i === active ? "true" : undefined}
                aria-label={`Show ${slide.label}`}
                className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                  i > 0 ? "border-l-[1.5px] border-border-heavy" : ""
                } ${
                  i === active
                    ? "bg-accent text-on-accent"
                    : "text-muted-foreground hover:bg-accent-tint hover:text-foreground"
                }`}
              >
                {slide.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        ref={trackRef}
        onScroll={isCarousel ? handleScroll : undefined}
        tabIndex={isCarousel ? 0 : undefined}
        aria-label={isCarousel ? "Swipe for more" : undefined}
        className={`${trackBase} ${trackWide}`}
      >
        {slides.map((slide) => {
          const narrow = isCarousel ? "w-[min(100cqw,56rem)] shrink-0 snap-center" : "w-full";
          const wide = hasCenter
            ? `min-[1440px]:row-start-1 min-[1440px]:w-auto ${GRID_COLUMN[slide.place]}`
            : `article-end-gutter min-[1440px]:absolute min-[1440px]:top-10 ${GUTTER[slide.place]}`;
          return (
            <div key={slide.key} className={`${narrow} ${wide}`}>
              {/* Each card keeps its own height: stretched to the verdict, the
                  spec card was mostly empty space at phone width. In the grid
                  the side cards follow the reader down the verdict instead. */}
              <div
                className={
                  hasCenter && slide.place !== "center" ? "min-[1440px]:sticky min-[1440px]:top-[5.25rem]" : ""
                }
              >
                {slide.node}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
