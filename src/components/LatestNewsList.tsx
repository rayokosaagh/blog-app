"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface LatestPost {
  id: string;
  slug: string;
  title: string;
  featuredImage: string | null;
  createdAt: Date;
}

interface LatestNewsListProps {
  posts: LatestPost[];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function LatestNewsList({ posts }: LatestNewsListProps) {
  if (posts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-sm dark:shadow-none"
    >
      <div className="flex items-center gap-2 mb-4">
        <motion.span
          className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent"
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.4 }}
        >
          <Clock className="w-4 h-4" />
        </motion.span>
        <h3 className="text-sm font-semibold text-foreground">Latest News</h3>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="space-y-1"
      >
        {posts.map((post) => (
          <motion.div key={post.id} variants={itemVariants}>
            <Link
              href={`/blog/${post.slug}`}
              className="flex items-center gap-3 group rounded-xl px-2 py-2 -mx-2 transition-colors hover:bg-foreground/5"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
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
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(post.createdAt)}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}