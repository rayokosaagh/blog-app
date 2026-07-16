"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { Bookmark } from "lucide-react";
import { sortTagsByOrder } from "@/lib/sortTags";
import { formatRelativeTime } from "@/lib/postUtils";
import TagIcon from "@/components/blog/TagIcon";
import Underline from "@/components/ui/Underline";

export interface FeedTag {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

export interface FeedPost {
  id: string;
  slug: string;
  title: string;
  featuredImage: string | null;
  createdAt: Date | string;
  content?: string | null;
  tags?: FeedTag[];
  tagOrder?: string[] | null;
  author: { name: string | null; image?: string | null };
}

interface LatestPostsFeedProps {
  posts: FeedPost[];
  /** Small accent label above the heading, e.g. "On this topic". Omit heading entirely if not provided. */
  eyebrow?: string;
  /** Section heading, e.g. "More Articles" or "Latest Posts". Omit to render just the grid, no header. */
  heading?: string;
  /** "View all" link shown top-right of the header, if heading is set. */
  viewAllHref?: string;
  /** Enables the interactive bookmark button on each tile. */
  showBookmark?: boolean;
  /** Max tiles to render. Defaults to 7 as a safety cap, since the tag/badge and gradient styling assumes a reasonably small feed. */
  maxPosts?: number;
  className?: string;
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Explicit, literal Tailwind classes so the build's content scanner picks
// them up (avoid constructing class names dynamically at runtime).
// Pattern repeats every 5 tiles: [big, wide, small, small, wide]
const TILE_SPANS = [
  "md:col-span-2 md:row-span-2", // 0 — big feature tile
  "md:col-span-2 md:row-span-1", // 1 — wide
  "md:col-span-1 md:row-span-1", // 2 — small
  "md:col-span-1 md:row-span-1", // 3 — small
  "md:col-span-2 md:row-span-1", // 4 — wide
];

// Alternates the tile's top accent bar / tag color between the two brand
// accents, same as the mock's LAPTOPS/MOBILES pill alternation.
const ACCENT_CYCLE = ["bg-accent", "bg-accent-2"] as const;
const ACCENT_TEXT_CYCLE = ["text-on-accent", "text-on-accent-2"] as const;

function isBig(index: number) {
  return index % 5 === 0;
}

function Tile({
  post,
  index,
  showBookmark,
}: {
  post: FeedPost;
  index: number;
  showBookmark: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [saved, setSaved] = useState(false);
  const [burst, setBurst] = useState(0);
  const href = `/blog/${post.slug}`;
  const orderedTags = sortTagsByOrder(post.tags ?? [], post.tagOrder ?? []);
  const primaryTag = orderedTags[0];
  const big = isBig(index);
  const accentBg = ACCENT_CYCLE[index % 2];
  const accentText = ACCENT_TEXT_CYCLE[index % 2];

  const variants: Variants = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.94, y: shouldReduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.5, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved((prev) => {
      const willSave = !prev;
      if (willSave) setBurst((b) => b + 1);
      return willSave;
    });
  };

  const span = TILE_SPANS[index % TILE_SPANS.length];
  const mobileHero = index === 0;
  const mobileSpan = mobileHero ? "col-span-2" : "col-span-1";
  const mobileAspect = mobileHero ? "aspect-[4/3]" : "aspect-square";

  return (
    <motion.div
      variants={variants}
      whileHover={shouldReduceMotion ? undefined : { y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`relative rounded-md overflow-hidden group border-[1.5px] border-border-heavy ${mobileSpan} ${mobileAspect} md:aspect-auto ${span}`}
    >
      {/* Colored top accent bar — the mock's "5px colored strip" cue,
          carried over from the flat 3-card grid onto the image tiles. */}
      <div className={`absolute top-0 left-0 right-0 h-[4px] z-10 ${accentBg}`} />

      <Link href={href} className="absolute inset-0 block bg-muted">
  <div className="relative w-full h-full overflow-hidden">
    {post.featuredImage ? (
      <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full bg-accent-tint" />
    )}
  </div>

  {/* Deliberate exception to the no-gradient rule (guide §1/§6): needed for
      text legibility over arbitrary photo content. Approved deviation —
      keep in sync if other image-tile components need the same treatment. */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5">
    <h3
      className={`group leading-tight tracking-tight ${
        mobileHero ? "text-base line-clamp-3 mb-1.5" : "text-xs line-clamp-2 mb-1"
      } ${big ? "md:text-xl lg:text-2xl md:mb-2 md:line-clamp-3" : "md:text-sm md:mb-1 md:line-clamp-2"}`}
    >
      <span className="font-bold text-white">
        <Underline>{post.title}</Underline>
      </span>
    </h3>
    <p className={`text-white/90 ${mobileHero ? "text-[11px]" : "text-[10px]"} ${big ? "md:text-xs lg:text-sm" : "md:text-[11px]"}`}>
      {post.author.name} · {formatRelativeTime(post.createdAt)}
    </p>
  </div>
</Link>

      <div className="absolute top-2.5 left-2.5 right-2.5 md:top-4 md:left-4 md:right-4 flex items-start justify-between gap-2 z-10 pointer-events-none">
        {primaryTag ? (
          <Link
            href={`/blog?tag=${primaryTag.slug}`}
            className={`pointer-events-auto inline-flex items-center gap-1 border-[1.5px] border-border-heavy font-bold uppercase tracking-wider rounded-md ${accentBg} ${accentText} ${
              mobileHero ? "text-[10px] px-2.5 py-0.5" : "text-[9px] px-2 py-0.5"
            } ${big ? "md:text-[11px] md:px-3 md:py-1" : "md:text-[10px] md:px-2.5 md:py-0.5"}`}
          >
            <TagIcon
              icon={primaryTag.icon}
              className="inline-flex w-2.5 h-2.5 md:w-3 md:h-3 [&>svg]:w-full [&>svg]:h-full"
            />
            <span>{primaryTag.name}</span>
          </Link>
        ) : (
          <span />
        )}

        {showBookmark && (
          <button
            onClick={toggleSave}
            aria-label={saved ? "Remove from saved" : "Save for later"}
            aria-pressed={saved}
            className="pointer-events-auto relative flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-md bg-black/55 border-[1.5px] border-white/30"
          >
            <AnimatePresence>
              {burst > 0 && saved && (
                <motion.span
                  key={burst}
                  initial={{ scale: 0.4, opacity: 0.55 }}
                  animate={{ scale: 1.9, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 rounded-md bg-white"
                />
              )}
            </AnimatePresence>
            <motion.span
              animate={saved && !shouldReduceMotion ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="relative flex items-center justify-center"
            >
              <Bookmark
                className={`w-[12px] h-[12px] md:w-[15px] md:h-[15px] transition-colors duration-200 ${
                  saved ? "text-white" : "text-white/80"
                }`}
                fill={saved ? "currentColor" : "none"}
                strokeWidth={2}
              />
            </motion.span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function LatestPostsFeed({
  posts,
  eyebrow,
  heading,
  viewAllHref,
  showBookmark = false,
  maxPosts = 7,
  className = "",
}: LatestPostsFeedProps) {
  const shouldReduceMotion = useReducedMotion();
  if (!posts || posts.length === 0) return null;

  const tiles = posts.slice(0, maxPosts);

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.06 } },
  };

  return (
    <div className={className}>
      {heading && (
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between gap-4 mb-6 pb-4 border-b-[1.5px] border-border-heavy"
        >
          <div>
            {eyebrow && (
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent mb-1.5">{eyebrow}</p>
            )}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{heading}</h2>
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="group/all hidden sm:inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted-foreground hover:text-accent transition-colors shrink-0 pb-1"
            >
              View all
              <ArrowIcon className="w-4 h-4 transition-transform duration-300 group-hover/all:translate-x-1" />
            </Link>
          )}
        </motion.div>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 md:auto-rows-[160px] lg:auto-rows-[180px] md:grid-flow-dense"
      >
        {tiles.map((post, i) => (
          <Tile key={post.id} post={post} index={i} showBookmark={showBookmark} />
        ))}
      </motion.div>
    </div>
  );
}