"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Star } from "lucide-react";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { getPostCategory } from "@/lib/blog/categories";

export interface MosaicStory {
  id: string;
  slug: string;
  title: string;
  featuredImage: string | null;
  createdAt: Date | string;
  category?: string | null;
  /** Editorial score (already gated through readVerdict), or null. */
  score: number | null;
}

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date));
}

/** Big, faint rank numeral — the mosaic's ordering cue, in the theme accent. */
function Rank({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`select-none font-black leading-none tabular-nums tracking-tighter text-accent/25 ${className}`}
    >
      {String(n).padStart(2, "0")}
    </span>
  );
}

function ScoreBadge({ score, className = "" }: { score: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 surface-pill border-border-heavy bg-accent px-2 py-0.5 text-[11px] font-extrabold tabular-nums text-on-accent shadow-brutal-sm ${className}`}
      aria-label={`Scored ${score.toFixed(1)} out of 10`}
    >
      <Star className="h-3 w-3" fill="currentColor" />
      {score.toFixed(1)}
    </span>
  );
}

function Meta({ story }: { story: MosaicStory }) {
  return (
    <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
      {getPostCategory(story.category).singular}
      <span aria-hidden className="mx-2 inline-block h-1 w-1 bg-border align-middle" />
      {formatDate(story.createdAt)}
    </p>
  );
}

/** Photo pinned to the card's right edge, fading into the card surface on the left. */
function SidePhoto({ story, width, sizes, priority = false }: { story: MosaicStory; width: string; sizes: string; priority?: boolean }) {
  return (
    // overflow-hidden matters: the photo zooms 3% on hover, and without the
    // clip its left edge slid out from under the fade gradient — a hairline of
    // raw photo appeared beside the headline on every hover.
    <div aria-hidden className={`pointer-events-none absolute inset-y-0 right-0 overflow-hidden ${width}`}>
      {story.featuredImage ? (
        <OptimizedImage
          src={story.featuredImage}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 bg-accent-tint" />
      )}
      {/* Fade into the card so the headline never sits on raw photo. */}
      <div className="absolute inset-y-0 left-0 w-[38%] bg-gradient-to-r from-card via-card/60 to-transparent" />
    </div>
  );
}

const CTA_BY_CATEGORY: Record<string, string> = {
  REVIEW: "Read full review",
  VERSUS: "See the comparison",
  DEAL: "See the deal",
  GUIDE: "Read the guide",
  NEWS: "Read the story",
};

/**
 * Top Stories as a four-up mosaic: the most-read story leads at half width
 * and full height; #2 and #3 sit beside it; #4 runs wide underneath. Every
 * card carries its rank numeral, category · date, and — when the piece is a
 * scored review — its verdict score.
 */
export default function TopStoriesMosaic({ stories }: { stories: MosaicStory[] }) {
  if (stories.length === 0) return null;
  const [lead, ...rest] = stories;
  const pair = rest.slice(0, 2);
  const wide = rest[2];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="grid gap-4 lg:grid-cols-[46fr_54fr] lg:grid-rows-2"
    >
      {/* Lead */}
      <motion.article variants={item} className="lg:row-span-2">
        <Link
          href={`/blog/${lead.slug}`}
          className="group relative flex h-full min-h-[18rem] flex-col justify-between overflow-hidden surface-border border-border-heavy bg-card p-6 shadow-brutal brutal-press sm:min-h-[22rem] lg:min-h-0"
        >
          <SidePhoto story={lead} width="w-[64%]" sizes="(min-width: 1024px) 480px, 65vw" priority />
          <div className="relative z-10 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 surface-pill border-border-heavy bg-accent px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-on-accent shadow-brutal-sm">
              <Flame className="h-3.5 w-3.5" fill="currentColor" />
              Most read
            </span>
            {lead.score !== null && <ScoreBadge score={lead.score} />}
          </div>
          <div className="relative z-10 mt-6 max-w-[56%] sm:max-w-[50%]">
            <Rank n={1} className="block text-6xl sm:text-7xl" />
            <h3 className="mt-2 text-xl font-extrabold leading-tight text-foreground sm:text-2xl xl:text-3xl">
              {lead.title}
            </h3>
            <div className="mt-3">
              <Meta story={lead} />
            </div>
            <span className="mt-5 inline-flex items-center gap-2 surface-pill border-border-heavy bg-card px-4 py-2 text-xs font-extrabold text-foreground shadow-brutal-sm transition-colors group-hover:bg-accent group-hover:text-on-accent">
              {CTA_BY_CATEGORY[lead.category ?? ""] ?? "Read the story"}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
      </motion.article>

      {/* #2 and #3 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {pair.map((s, i) => (
          <motion.article key={s.id} variants={item}>
            <Link
              href={`/blog/${s.slug}`}
              className="group relative flex h-full min-h-[11rem] flex-col overflow-hidden surface-border border-border-heavy bg-card p-5 shadow-brutal brutal-press"
            >
              <SidePhoto story={s} width="w-[54%]" sizes="(min-width: 1024px) 280px, 55vw" />
              {s.score !== null && <ScoreBadge score={s.score} className="absolute right-3 top-3 z-10" />}
              <div className="relative z-10 max-w-[60%]">
                <Rank n={i + 2} className="block text-4xl" />
                <h3 className="mt-2 line-clamp-3 text-base font-extrabold leading-snug text-foreground sm:text-lg">
                  {s.title}
                </h3>
                <div className="mt-2.5">
                  <Meta story={s} />
                </div>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>

      {/* #4, wide */}
      {wide && (
        <motion.article variants={item}>
          <Link
            href={`/blog/${wide.slug}`}
            className="group relative flex h-full min-h-[9rem] flex-col justify-between overflow-hidden surface-border border-border-heavy bg-card p-5 shadow-brutal brutal-press"
          >
            <SidePhoto story={wide} width="w-[56%]" sizes="(min-width: 1024px) 560px, 60vw" />
            <div className="relative z-10 flex max-w-[54%] items-start gap-4">
              <Rank n={4} className="text-4xl sm:text-5xl" />
              <h3 className="line-clamp-2 text-base font-extrabold leading-snug text-foreground sm:text-lg">
                {wide.title}
              </h3>
            </div>
            <div className="relative z-10 mt-4 flex items-center gap-3">
              {wide.score !== null && <ScoreBadge score={wide.score} />}
              <Meta story={wide} />
            </div>
          </Link>
        </motion.article>
      )}
    </motion.div>
  );
}
