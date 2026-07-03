"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface TrendingPost {
  id: string;
  slug: string;
  title: string;
  featuredImage: string | null;
  views: number;
}

interface TrendingNewsListProps {
  posts: TrendingPost[];
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function TrendingNewsList({ posts }: TrendingNewsListProps) {
  if (posts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative bg-card border border-border rounded-2xl p-5 shadow-sm dark:shadow-none overflow-hidden"
    >
      {/* Subtle animated glow behind the flame icon */}
      <div className="flex items-center gap-2 mb-4 relative">
        <motion.span
          className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent overflow-hidden"
          whileHover={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 0.4 }}
        >
          <motion.span
            className="absolute inset-0 rounded-lg bg-accent/25"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <Flame className="w-4 h-4 relative z-10" />
        </motion.span>
        <h3 className="text-sm font-semibold text-foreground">Trending Now</h3>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="space-y-1"
      >
        {posts.map((post, i) => (
          <motion.div key={post.id} variants={itemVariants}>
            <Link
              href={`/blog/${post.slug}`}
              className="flex items-center gap-3 group rounded-xl px-2 py-2 -mx-2 transition-colors hover:bg-foreground/5"
            >
              <motion.span
                className="text-lg font-bold text-muted-foreground/40 w-5 shrink-0 tabular-nums"
                whileHover={{ scale: 1.15, color: "var(--accent)" }}
                transition={{ duration: 0.15 }}
              >
                {i + 1}
              </motion.span>

              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 relative">
                {post.featuredImage ? (
                  <motion.img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.12 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/40 dark:to-indigo-800/30 flex items-center justify-center">
                    <span className="text-lg">📝</span>
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                  {post.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <motion.span
                    className="inline-block w-1.5 h-1.5 rounded-full bg-accent"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                  />
                  {post.views.toLocaleString()} views
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}