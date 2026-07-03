"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark } from "lucide-react";
import { sortTagsByOrder } from "@/lib/sortTags";

interface Tag {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

interface FeedPost {
  id: string;
  slug: string;
  title: string;
  featuredImage: string | null;
  createdAt: Date | string;
  content?: string | null;
  tagOrder?: string[] | null;
  tags: Tag[];
  author: { name: string | null };
}

interface LatestPostsFeedProps {
  posts: FeedPost[];
  className?: string;
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date));
}

function readingTime(html?: string | null) {
  if (!html) return null;
  const text = html.replace(/<[^>]*>/g, " ").trim();
  if (!text) return null;
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

// Parent controls the reveal choreography; children just declare their own
// "hidden" / "show" pose and inherit timing via context (no per-row
// viewport polling needed, which keeps this cheap on scroll).
const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 340, damping: 30, mass: 0.7 },
  },
};

export default function LatestPostsFeed({ posts, className = "" }: LatestPostsFeedProps) {
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [burst, setBurst] = useState<Record<string, number>>({});

  const toggleSave = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved((prev) => {
      const next = new Set(prev);
      const willSave = !next.has(id);
      willSave ? next.add(id) : next.delete(id);
      if (willSave) {
        setBurst((b) => ({ ...b, [id]: (b[id] ?? 0) + 1 }));
      }
      return next;
    });
  };

  const markLoaded = (id: string) => {
    setLoaded((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      variants={listVariants}
      className={`bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none ${className}`}
    >
      {posts.map((post) => {
        const orderedTags = sortTagsByOrder(post.tags, post.tagOrder ?? []);
        const primaryTag = orderedTags[0];
        const minutes = readingTime(post.content);
        const isSaved = saved.has(post.id);
        const isLoaded = loaded.has(post.id);

        return (
          <motion.div key={post.id} variants={rowVariants} className="group relative">
            <Link href={`/blog/${post.slug}`} className="block">
              <motion.div
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-200 hover:bg-accent/5 active:bg-accent/[0.07]"
              >
                {/* Thumbnail */}
                <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-foreground/5">
                  {post.featuredImage ? (
                    <>
                      {!isLoaded && (
                        <div className="absolute inset-0 animate-pulse bg-foreground/10" />
                      )}
                      <motion.img
                        src={post.featuredImage}
                        alt={post.title}
                        onLoad={() => markLoaded(post.id)}
                        initial={false}
                        animate={{ opacity: isLoaded ? 1 : 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                      />
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/30 flex items-center justify-center">
                      <span className="text-xl">📝</span>
                    </div>
                  )}
                </div>

                {/* Text content */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-1 transition-colors duration-200 group-hover:text-accent">
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                    {primaryTag && (
                      <>
                        <span className="font-medium text-accent">{primaryTag.name}</span>
                        <span>·</span>
                      </>
                    )}
                    <span>{formatDate(post.createdAt)}</span>
                    {minutes && (
                      <>
                        <span>·</span>
                        <span>{minutes} min</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Bookmark */}
                <button
                  onClick={(e) => toggleSave(e, post.id)}
                  aria-label={isSaved ? "Remove from saved" : "Save for later"}
                  aria-pressed={isSaved}
                  className="relative flex-shrink-0 flex items-center justify-center w-9 h-9 -mr-1.5 rounded-full"
                >
                  <AnimatePresence>
                    {burst[post.id] && isSaved && (
                      <motion.span
                        key={burst[post.id]}
                        initial={{ scale: 0.4, opacity: 0.55 }}
                        animate={{ scale: 1.9, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full bg-accent"
                      />
                    )}
                  </AnimatePresence>
                  <motion.span
                    animate={isSaved ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                    transition={{ duration: 0.32, ease: "easeOut" }}
                    className="relative"
                  >
                    <Bookmark
                      className={`w-4 h-4 transition-colors duration-200 ${
                        isSaved ? "text-accent" : "text-muted-foreground"
                      }`}
                      fill={isSaved ? "currentColor" : "none"}
                      strokeWidth={2}
                    />
                  </motion.span>
                </button>
              </motion.div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}