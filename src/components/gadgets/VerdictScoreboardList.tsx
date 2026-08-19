"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { VERDICT_MAX, verdictBand, type Verdict } from "@/lib/verdict";

export interface ScoredProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image: string | null;
  categoryName: string;
  verdict: Verdict;
}

/**
 * Editor's verdicts as a fanned hover accordion.
 *
 * The panels overlap rather than sitting in a gapped row: each one tucks under
 * the panel to its left, which is what clips the category pill on the closed
 * spines and gives the stack its layered look. Earlier panels therefore paint
 * above later ones, and whichever panel is open is lifted above all of them.
 *
 * Motion. Everything that changes between closed and open — flex-grow, the
 * fan insets, the overlap margin, and the mobile height — is a numeric value
 * animated by framer on ONE element per panel, with one shared transition, so
 * the whole row moves as a single gesture. Two things this replaces, both of
 * which read as jank: swapping the panel between a <Link> and a <button> when
 * it opened (a remount, so nothing could animate), and mounting/unmounting
 * the text (a pop). The panel is now always the same <motion.div>, with the
 * link as an overlay, and the text cross-fades — its fade-in is delayed until
 * the panel has mostly finished growing, so it never reflows word-by-word in
 * front of the reader.
 *
 * Pointer hover drives it — no arrows, no dots. On touch, where hover does not
 * exist, tapping a closed spine opens it and only the open panel navigates.
 * Keyboard focus opens a panel too.
 */
export default function VerdictScoreboardList({ products }: { products: ScoredProduct[] }) {
  const [active, setActive] = useState(0);
  const count = products.length;
  // sm breakpoint. Below it the row is a vertical stack with fixed-height
  // closed panels; from it, a horizontal fan sized by flex-grow.
  const isRow = useMediaQuery("(min-width: 640px)");
  // Open-panel image width steps up at lg, where the open panel is wide enough
  // for a bigger photo next to the text.
  const isWide = useMediaQuery("(min-width: 1024px)");
  const reduceMotion = useReducedMotion();

  // Container width, live. Needed to give a *closing* panel's image box a
  // pixel target: its natural target is "100% of a spine", but framer resolves
  // percentages when the tween starts — while the panel is still wide — so the
  // box swelled toward the open width and then snapped to the spine width when
  // the panel finished shrinking. That was the "zoom in and out". With the
  // spine width known, the box tweens straight from open px to spine px.
  const rowRef = useRef<HTMLDivElement>(null);
  const [rowW, setRowW] = useState(0);
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setRowW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Grow units: the open panel is 3, each spine 1; overlaps hand back 16px per
  // seam. Minus the spine's horizontal padding (px-6 each side).
  const spineW = rowW > 0 ? (rowW + OVERLAP_X * (count - 1)) / (count + 2) : 0;
  const spineBoxW = Math.max(0, Math.round(spineW - 48));

  return (
    <div ref={rowRef} className="flex flex-col sm:h-[24rem] sm:flex-row sm:items-stretch">
      {products.map((p, i) => (
        <VerdictPanel
          key={p.id}
          p={p}
          index={i}
          count={count}
          distance={Math.abs(i - active)}
          isActive={i === active}
          isRow={isRow}
          isWide={isWide}
          spineBoxW={spineBoxW}
          reduceMotion={!!reduceMotion}
          onActivate={() => setActive(i)}
        />
      ))}
    </div>
  );
}

// One curve for the whole row: a firm decelerate with no overshoot, long
// enough to read as a slide rather than a snap. Text fades in on the tail of
// it and out at the very start.
const PANEL_T = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };
const TEXT_IN_T = { delay: 0.2, duration: 0.3, ease: "easeOut" as const };
const TEXT_OUT_T = { duration: 0.12, ease: "easeIn" as const };
const INSTANT = { duration: 0 };

/** Fan inset (px) for a closed panel `distance` steps from the open one. */
const FAN_STEP = 8;
const FAN_MAX = 3;
/** Horizontal overlap between neighbours (px) — clips the pill on spines. */
const OVERLAP_X = 16;
const OVERLAP_Y = 8;
/** Depth cues. Closed spines sink one step per panel of distance from the
    open one: a veil the colour of the page background (so they read as
    receding into it, in light and dark alike), a lighter shadow, and — for the
    open panel — a small lift. All three step with `distance`, the same value
    that drives the fan insets, so depth and geometry always agree. */
const VEIL_STEP = 0.14;
const LIFT_Y = -6;
/** Open-panel image box width (px) from lg / from sm. Pixel targets on
    purpose: tweening "100%" → "30%" while the panel itself grows made the
    box's real width rise and then fall (241 → ~312 → 215px), which read as
    the photo zooming in and out. Framer measures the spine's current px
    width and tweens straight to these, so the box only ever moves one way. */
const IMG_W_LG = 224;
const IMG_W_SM = 150;
/** Closed panel height on phones (px). */
const CLOSED_H = 96;

function VerdictPanel({
  p,
  index,
  count,
  distance,
  isActive,
  isRow,
  isWide,
  spineBoxW,
  reduceMotion,
  onActivate,
}: {
  p: ScoredProduct;
  index: number;
  count: number;
  distance: number;
  isActive: boolean;
  isRow: boolean;
  isWide: boolean;
  /** Pixel width of a closed spine's image box; 0 before the row is measured. */
  spineBoxW: number;
  reduceMotion: boolean;
  onActivate: () => void;
}) {
  const { score, summary, subScores } = p.verdict;
  const depth = isActive ? 0 : Math.min(distance, FAN_MAX);
  const fan = depth * FAN_STEP;
  const veil = depth * VEIL_STEP;
  const shadow = isActive ? "shadow-brutal-lg" : depth >= 2 ? "shadow-brutal-sm" : "shadow-brutal";

  // Earlier panels paint above later ones so the fan tucks to the right; the
  // open panel is lifted above the whole stack.
  const z = isActive ? count + 1 : count - index;

  const target = isRow
    ? {
        flexGrow: isActive ? 3 : 1,
        y: isActive ? LIFT_Y : 0,
        height: "auto",
        marginTop: fan,
        marginBottom: fan,
        marginLeft: index > 0 ? -OVERLAP_X : 0,
      }
    : {
        flexGrow: 0,
        y: 0,
        height: isActive ? "auto" : CLOSED_H,
        marginTop: index > 0 ? -OVERLAP_Y : 0,
        marginBottom: 0,
        marginLeft: 0,
      };

  return (
    <motion.div
      // Static styles: basis 0 so flex-grow alone sets the width in the row.
      style={{ zIndex: z, flexBasis: isRow ? "0%" : "auto", flexShrink: 1 }}
      initial={false}
      animate={target}
      transition={reduceMotion ? INSTANT : PANEL_T}
      // Hover opens panels only in the horizontal fan. In the vertical stack
      // the panels above the pointer collapse when one opens, the whole stack
      // shifts up under a pointer that hasn't moved, and the browser fires
      // mouseenter on whichever panel slid underneath — which then opens,
      // shifting again. Stacked mode is tap-driven (that's its audience
      // anyway); the click handler on the link overlay does the opening.
      onMouseEnter={isRow ? onActivate : undefined}
      onFocus={onActivate}
      className={`group relative flex min-w-0 flex-col overflow-hidden surface-border border-border-heavy bg-card transition-shadow duration-300 ${shadow} ${
        isActive ? "" : "cursor-pointer"
      }`}
    >
      {/* The link is an overlay so the panel element itself never changes
          type. A closed spine swallows the click and opens instead — that's
          how touch (no hover) gets to the open state; on a pointer device the
          hover has already opened it by the time the click lands. */}
      <Link
        href={`/product/${p.slug}`}
        onClick={(e) => {
          if (!isActive) {
            e.preventDefault();
            onActivate();
          }
        }}
        aria-expanded={isActive}
        aria-label={
          isActive
            ? `${p.name}: ${score.toFixed(1)} out of ${VERDICT_MAX}, ${verdictBand(score)} — read the verdict`
            : `Show verdict for ${p.name}`
        }
        className="absolute inset-0 z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />

      {/* Depth veil — page-background tint over a closed spine, deeper the
          further it sits from the open panel. Above the content, below the
          pill/score chips and the link overlay. */}
      <motion.span
        aria-hidden
        initial={false}
        animate={{ opacity: veil }}
        transition={reduceMotion ? INSTANT : PANEL_T}
        style={{ backgroundColor: "var(--depth-veil)" }}
        className="pointer-events-none absolute inset-0 z-[5]"
      />

      {/* Taxonomy left, score right — the pill is the piece the neighbouring
          panel clips when this one is closed. */}
      <span className="tag-pill tag-pill-quiet absolute left-4 top-4 z-10 whitespace-nowrap">
        {p.categoryName}
      </span>

      <span className="absolute right-4 top-4 z-10 flex flex-col items-center surface-pill border-border-heavy bg-accent px-3 py-1.5 text-on-accent shadow-brutal-sm">
        <span className="flex items-baseline gap-0.5 font-black leading-none tabular-nums">
          <span className="text-xl sm:text-2xl">{score.toFixed(1)}</span>
          <span className="text-[10px] opacity-70">/{VERDICT_MAX}</span>
        </span>
        <span className="mt-0.5 text-[9px] font-extrabold uppercase tracking-[0.14em]">
          {verdictBand(score)}
        </span>
      </span>

      {/* pt-20 both sides: at pt-16 the score chip (taller than the pill it
          sits opposite) overlapped the headline on phones. Column on mobile,
          row from sm — side by side at 390px left the summary wrapping every
          three words. */}
      <div
        className={`flex min-h-0 flex-1 flex-col items-center gap-4 px-4 sm:flex-row sm:gap-6 sm:px-6 sm:pb-5 sm:pt-20 ${
          isActive ? "pb-5 pt-20" : "max-sm:py-0"
        }`}
      >
        {/* Image box width is tweened with the panel (100% of a spine → 30%
            of the open panel) instead of swapping classes, so the photo
            slides into place rather than jumping left the instant the panel
            starts to grow. Phones don't animate it — a closed spine has no
            image there, so there is nothing to tween from. */}
        <motion.div
          initial={false}
          animate={{
            width: !isRow
              ? "auto"
              : isActive
                ? isWide
                  ? IMG_W_LG
                  : IMG_W_SM
                : spineBoxW || "100%",
          }}
          transition={reduceMotion ? INSTANT : PANEL_T}
          className={`relative min-h-0 shrink-0 ${
            isActive
              ? "h-36 w-full max-w-[11rem] sm:h-auto sm:max-w-none sm:self-stretch"
              : "hidden self-stretch sm:block"
          }`}
        >
          {p.image ? (
            <OptimizedImage
              src={p.image}
              alt={p.name}
              fill
              sizes="(min-width: 1024px) 280px, (min-width: 640px) 20vw, 40vw"
              // Product shots are cut-outs on white and object-contain
              // letterboxes them, so a radius on the element alone never
              // reaches the picture's corners. Painting the element white
              // makes it a photo plate: invisible on light cards, a rounded
              // tile on dark ones — and square in the brutalist theme, where
              // --radius is 0.
              className="rounded-[var(--radius)] bg-white object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl">📱</div>
          )}
        </motion.div>

        {/* Only the open panel carries text — a spine is too narrow to hold a
            headline without it wrapping into a column of single letters. */}
        <AnimatePresence initial={false}>
          {isActive && (
            <motion.div
              key="body"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: reduceMotion ? INSTANT : TEXT_IN_T }}
              exit={{ opacity: 0, transition: reduceMotion ? INSTANT : TEXT_OUT_T }}
              className="flex w-full min-w-0 flex-col sm:flex-1 sm:self-stretch"
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">
                {p.brand}
              </p>
              <h3 className="mt-0.5 line-clamp-2 text-lg font-extrabold leading-snug tracking-tight text-foreground sm:text-xl lg:text-2xl">
                {p.name}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {summary}
              </p>

              <VerdictStats score={score} subScores={subScores} reduceMotion={reduceMotion} />

              <span className="mt-auto inline-flex items-center gap-2 pt-3 text-xs font-extrabold uppercase tracking-wide text-foreground transition-colors duration-100 group-hover:text-accent">
                Read verdict
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// The card is a summary; four bars is the most that still reads at a glance.
// The product page's VerdictCard shows all of them.
const MAX_BARS = 4;

/**
 * The verdict breakdown for the open panel: up to four sub-score bars in two
 * columns, or the overall bar alone when the editor only gave a headline
 * number. Bars fill in on entry (a width tween) so the stats read as
 * "arriving" with the panel rather than being stamped on.
 */
function VerdictStats({
  score,
  subScores,
  reduceMotion,
}: {
  score: number;
  subScores: Verdict["subScores"];
  reduceMotion: boolean;
}) {
  const rows = subScores.length > 0 ? subScores.slice(0, MAX_BARS) : [{ label: "Overall", score }];
  return (
    <dl className="mt-3 grid gap-x-5 gap-y-2 sm:grid-cols-2">
      {rows.map((s, i) => {
        const pct = (s.score / VERDICT_MAX) * 100;
        return (
          <div key={s.label} className="min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="truncate text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">
                {s.label}
              </dt>
              <dd className="shrink-0 text-xs font-black tabular-nums text-foreground">
                {s.score.toFixed(1)}
              </dd>
            </div>
            <div
              className="mt-1 h-2 border-[1.5px] border-border-heavy bg-background"
              role="img"
              aria-label={`${s.label}: ${s.score} out of ${VERDICT_MAX}`}
            >
              <motion.div
                className="h-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={
                  reduceMotion
                    ? INSTANT
                    : { delay: 0.34 + i * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }
                }
              />
            </div>
          </div>
        );
      })}
    </dl>
  );
}
