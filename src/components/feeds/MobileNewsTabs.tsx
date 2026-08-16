"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Clock3 } from "lucide-react";

interface TrendingPost {
  id: string;
  slug: string;
  title: string;
  featuredImage: string | null;
  views: number;
  createdAt: Date | string;
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
const MAX_ITEMS = 5;

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

// Container-level slide + stagger when switching tabs
const listVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 28 : -28, opacity: 0 }),
  center: {
    x: 0,
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
  exit: (dir: number) => ({ x: dir > 0 ? -28 : 28, opacity: 0, transition: { duration: 0.16, ease: "easeIn" as const } }),
};

const rowItemVariants = {
  enter: { opacity: 0, y: 14, scale: 0.98 },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 360, damping: 30 },
  },
};

export default function MobileNewsTabs({ trendingPosts = [], latestPosts = [] }: MobileNewsTabsProps) {
  const [tab, setTab] = useState<Tab>("trending");
  const [direction, setDirection] = useState(1);

  const selectTab = (t: Tab) => {
    if (t === tab) return;
    setDirection(TAB_INDEX[t] > TAB_INDEX[tab] ? 1 : -1);
    setTab(t);
  };

  if (trendingPosts.length === 0 && latestPosts.length === 0) return null;

  const posts = (tab === "trending" ? trendingPosts : latestPosts).slice(0, MAX_ITEMS);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="lg:hidden bg-card border-2 border-border-heavy shadow-brutal p-4"
    >
      {/* Tab switcher: two hard-bordered chips instead of an underline indicator */}
      <div className="flex items-center gap-2 mb-4">
        {(["trending", "latest"] as Tab[]).map((t) => {
          const active = tab === t;
          return (
            <motion.button
              key={t}
              onClick={() => selectTab(t)}
              whileTap={{ scale: 0.96 }}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 border-2 border-border-heavy text-xs font-extrabold uppercase tracking-wide transition-all duration-150 ease-out ${
                active
                  ? "bg-accent text-on-accent shadow-brutal-sm"
                  : "bg-transparent text-muted-foreground shadow-none"
              }`}
            >
              <motion.span
                animate={
                  active
                    ? t === "trending"
                      ? { rotate: [0, -10, 8, -4, 0], scale: [1, 1.15, 1] }
                      : { rotate: [0, 15, 0] }
                    : { rotate: 0, scale: 1 }
                }
                transition={{ duration: 1.5, repeat: active ? Infinity : 0, repeatDelay: 1.4 }}
                className="flex items-center"
              >
                {t === "trending" ? (
                  <Flame className="w-3.5 h-3.5" fill={active ? "currentColor" : "none"} />
                ) : (
                  <Clock3 className="w-3.5 h-3.5" />
                )}
              </motion.span>
              <span>{t === "trending" ? "Trending" : "Latest"}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Vertical list */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={tab}
          custom={direction}
          variants={listVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        >
          {posts.map((post, i) => {
            const isLast = i === posts.length - 1;

            return (
              <motion.div key={post.id} variants={rowItemVariants} layout>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 420, damping: 22 }}
                    className={`flex items-center gap-3 py-3 -mx-2 px-2 transition-colors duration-100 ease-linear group-hover:bg-accent-tint ${
                      !isLast ? "border-b-[1.5px] border-border" : ""
                    }`}
                  >
                    {/* Rank badge: now shown on both tabs, yellow to match the
                        accent-2 chip used for the "Trending Now" flame icon
                        in globals.css / TrendingNewsList */}
                    <span
                      className="flex items-center justify-center w-6 h-6 shrink-0 border-2 border-border-heavy bg-accent-2 text-on-accent-2 text-xs font-extrabold shadow-brutal-sm transition-all duration-150 ease-out group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none"
                      aria-hidden
                    >
                      {i + 1}
                    </span>

                    {/* Text block */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug transition-colors group-hover:text-accent">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="h-[2px] w-3 bg-border-heavy shrink-0" />
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Clock3 className="w-3 h-3" />
                          {timeAgo(post.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Thumbnail: hard-bordered block, presses with the row on hover */}
                    <div className="shrink-0 w-14 h-14 overflow-hidden bg-border border-2 border-border-heavy shadow-brutal-sm transition-all duration-150 ease-out group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none">
                      {post.featuredImage ? (
                        <img loading="lazy" decoding="async"
                          src={post.featuredImage}
                          alt={post.title}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover grayscale contrast-[1.05] transition-all duration-200 ease-out group-hover:grayscale-0"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-accent-tint">
                          <span className="text-base">📝</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}