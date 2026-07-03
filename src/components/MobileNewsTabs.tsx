"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Flame, Sparkles } from "lucide-react";

interface TrendingPost {
  id: string;
  slug: string;
  title: string;
  featuredImage: string | null;
  views: number;
}

interface LatestPost {
  id: string;
  slug: string;
  title: string;
  featuredImage: string | null;
  createdAt: Date | string;
}

interface MobileNewsTabsProps {
  trendingPosts: TrendingPost[];
  latestPosts: LatestPost[];
}

type Tab = "trending" | "latest";

const TAB_INDEX: Record<Tab, number> = { trending: 0, latest: 1 };

function timeAgo(date: Date | string) {
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

function isFresh(date: Date | string) {
  return Date.now() - new Date(date).getTime() < 60 * 60 * 1000; // under 1h old
}

// Flick-in entrance: 2D only (no perspective/preserve-3d), safe inside a scrolling flex row on iOS Safari
const cardVariants = {
  enter: { opacity: 0, y: 26, scale: 0.88, rotate: -6 },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 24, mass: 0.7 },
  },
};

// Direction slide + stagger. IMPORTANT: this now lives on a WRAPPER element,
// never on the element that also has overflow-x-auto/snap-x — animating a
// CSS transform on the native scroll container itself breaks scroll-snap
// layout on iOS Safari (cards collapse/stretch, only one renders correctly).
const rowVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 36 : -36, opacity: 0 }),
  center: {
    x: 0,
    opacity: 1,
    transition: { staggerChildren: 0.055, delayChildren: 0.05 },
  },
  exit: (dir: number) => ({ x: dir > 0 ? -36 : 36, opacity: 0, transition: { duration: 0.18 } }),
};

export default function MobileNewsTabs({ trendingPosts = [], latestPosts = [] }: MobileNewsTabsProps) {
  const [tab, setTab] = useState<Tab>("trending");
  const [direction, setDirection] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rawProgress = useMotionValue(0);
  const smoothProgress = useSpring(rawProgress, { stiffness: 300, damping: 40, mass: 0.4 });

  useEffect(() => {
    rawProgress.set(0);
  }, [tab, rawProgress]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    rawProgress.set(max > 0 ? el.scrollLeft / max : 0);
  };

  const selectTab = (t: Tab) => {
    if (t === tab) return;
    setDirection(TAB_INDEX[t] > TAB_INDEX[tab] ? 1 : -1);
    setTab(t);
  };

  if (trendingPosts.length === 0 && latestPosts.length === 0) return null;

  const posts = tab === "trending" ? trendingPosts : latestPosts;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="lg:hidden bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none dark:border border-border p-4 overflow-hidden"
    >
      {/* Tab toggle with bouncy sliding pill */}
      <div className="relative flex items-center bg-foreground/5 rounded-xl p-1 mb-4">
        {(["trending", "latest"] as Tab[]).map((t) => (
          <motion.button
            key={t}
            onClick={() => selectTab(t)}
            whileTap={{ scale: 0.95 }}
            className="relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold z-10"
          >
            {tab === t && (
              <motion.div
                layoutId="mobile-tab-pill"
                className="absolute inset-0 rounded-lg"
                style={{ backgroundColor: "var(--accent)" }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span
              className={`relative flex items-center gap-1.5 transition-colors duration-200 ${
                tab === t ? "text-white" : "text-muted-foreground"
              }`}
            >
              {t === "trending" ? (
                <motion.span
                  animate={
                    tab === "trending"
                      ? { rotate: [0, -10, 8, -4, 0], scale: [1, 1.15, 1] }
                      : { rotate: 0, scale: 1 }
                  }
                  transition={{ duration: 1.6, repeat: tab === "trending" ? Infinity : 0, repeatDelay: 1.2 }}
                >
                  <Flame className="w-3.5 h-3.5" />
                </motion.span>
              ) : (
                <motion.span
                  animate={tab === "latest" ? { rotate: [0, 15, 0] } : { rotate: 0 }}
                  transition={{ duration: 1.4, repeat: tab === "latest" ? Infinity : 0, repeatDelay: 1.4 }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </motion.span>
              )}
              {t === "trending" ? "Trending" : "Latest"}
            </span>
          </motion.button>
        ))}
      </div>

      {/*
        Two-layer structure:
        - OUTER (motion.div): owns the direction slide + opacity + stagger.
          This is where a CSS transform (x) gets applied — fine, because
          this element has no overflow-x-auto/scroll behavior of its own.
        - INNER (plain div): owns overflow-x-auto / snap-x / ref / onScroll.
          It never receives a transform animation, so iOS Safari computes
          its scroll width/snap points correctly.
        Framer Motion variants propagate through the plain inner div via
        context, so the card stagger below still works unchanged.
      */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={tab}
          custom={direction}
          variants={rowVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        >
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1 scrollbar-hide"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {posts.map((post, i) => {
              const fresh = tab === "latest" && isFresh((post as LatestPost).createdAt);
              return (
                <motion.div
                  key={post.id}
                  variants={cardVariants}
                  className="snap-start shrink-0 w-40"
                >
                  <Link href={`/blog/${post.slug}`} className="group block h-full">
                    <motion.div
                      whileTap={{ scale: 0.93, rotate: -1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 22 }}
                      className="rounded-xl overflow-hidden border border-border bg-background h-full"
                    >
                      <div className="relative w-full h-24 overflow-hidden">
                        {post.featuredImage ? (
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            width={160}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/40 dark:to-indigo-800/30 flex items-center justify-center">
                            <span className="text-xl">📝</span>
                          </div>
                        )}

                        {/* Rank / freshness badge */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          transition={{ delay: 0.18 + i * 0.03, type: "spring", stiffness: 420, damping: 18 }}
                          className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                        >
                          {tab === "trending" ? <>#{i + 1}</> : <>{timeAgo((post as LatestPost).createdAt)}</>}
                        </motion.div>

                        {fresh && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.25 + i * 0.03, type: "spring", stiffness: 420, damping: 16 }}
                            className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white"
                            style={{ backgroundColor: "var(--accent)" }}
                          >
                            <motion.span
                              className="inline-block w-1 h-1 rounded-full bg-white"
                              animate={{ opacity: [1, 0.2, 1], scale: [1, 1.6, 1] }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                            />
                            NEW
                          </motion.div>
                        )}
                      </div>

                      <div className="p-2.5">
                        <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug min-h-[2.2em]">
                          {post.title}
                        </p>
                        {tab === "trending" && (
                          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                            <motion.span
                              className="inline-block w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: "var(--accent)" }}
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
                            />
                            {(post as TrendingPost).views.toLocaleString()} views
                          </p>
                        )}
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Live scroll progress, wired to actual scroll position */}
      {posts.length > 2 && (
        <div className="relative h-1 mt-3 rounded-full bg-foreground/10 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              scaleX: smoothProgress,
              transformOrigin: "0% 50%",
              width: "100%",
              backgroundColor: "var(--accent)",
            }}
          />
        </div>
      )}
    </motion.div>
  );
}