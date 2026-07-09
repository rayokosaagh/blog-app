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
      className="lg:hidden bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none dark:border border-border p-4"
    >
      {/* Icon + text tab switcher with animated underline */}
      <div className="flex items-center gap-6 mb-4">
        {(["trending", "latest"] as Tab[]).map((t) => {
          const active = tab === t;
          return (
            <motion.button
              key={t}
              onClick={() => selectTab(t)}
              whileTap={{ scale: 0.94 }}
              className="relative flex items-center gap-1.5 pb-2 text-[15px] font-semibold"
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
                className={active ? "text-[var(--accent)]" : "text-muted-foreground"}
              >
                {t === "trending" ? <Flame className="w-4 h-4" /> : <Clock3 className="w-4 h-4" />}
              </motion.span>
              <span className={active ? "text-foreground" : "text-muted-foreground"}>
                {t === "trending" ? "Trending" : "Latest"}
              </span>
              {active && (
                <motion.div
                  layoutId="mobile-tab-underline"
                  className="absolute -bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: "var(--accent)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
              )}
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
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ x: 2 }}
                    transition={{ type: "spring", stiffness: 420, damping: 22 }}
                    className={`flex items-center gap-3 py-3 ${
                      !isLast ? "border-b border-border" : ""
                    }`}
                  >
                    {/* Rank badge for trending, keeps things visually distinct from Latest */}
                    {tab === "trending" && (
                      <span
                        className="shrink-0 w-5 text-center text-xs font-bold"
                        style={{ color: "var(--accent)" }}
                      >
                        {i + 1}
                      </span>
                    )}

                    {/* Text block */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug transition-colors group-hover:text-[var(--accent)]">
                        {post.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                        <Clock3 className="w-3 h-3" />
                        {timeAgo(post.createdAt)}
                      </p>
                    </div>

                    {/* Thumbnail */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 24 }}
                      className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-foreground/5"
                    >
                      {post.featuredImage ? (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/40 dark:to-indigo-800/30 flex items-center justify-center">
                          <span className="text-base">📝</span>
                        </div>
                      )}
                    </motion.div>
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