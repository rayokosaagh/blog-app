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
  createdAt: Date;
}

interface TrendingNewsListProps {
  posts: TrendingPost[];
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
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
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
      className="bg-card rounded-xl border border-border p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Flame className="w-4 h-4 text-accent" fill="currentColor" />
        <h3 className="text-xs font-bold tracking-[0.14em] uppercase text-foreground">
          Trending Now
        </h3>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="flex flex-col"
      >
        {posts.map((post, i) => (
          <motion.div key={post.id} variants={itemVariants}>
            <Link
              href={`/blog/${post.slug}`}
              className="group relative flex items-center gap-3.5 py-3"
            >
              {/* Accent bar: flat, grows from 0 height on hover instead of a numbered badge */}
              <span className="relative w-[3px] self-stretch shrink-0 bg-border overflow-hidden rounded-full">
                <motion.span
                  className="absolute inset-x-0 bottom-0 bg-accent rounded-full"
                  initial={{ height: "0%" }}
                  whileHover={{ height: "100%" }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              </span>

              {/* Thumbnail: flat grayscale by default, snaps to full color on hover — the signature move */}
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-border">
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover grayscale contrast-[1.05] transition-all duration-300 ease-out group-hover:grayscale-0 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <span className="text-lg">📝</span>
                  </div>
                )}
              </div>

              {/* Title + date, with a flat underline that draws in on hover */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 transition-colors duration-200 group-hover:text-accent">
                  {post.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-[1.5px] w-0 bg-accent transition-all duration-300 ease-out group-hover:w-4" />
                  <p className="text-xs text-muted-foreground">
                    {formatDate(post.createdAt)}
                  </p>
                </div>
              </div>
            </Link>

            {/* Flat divider between rows, skipped after the last item */}
            {i < posts.length - 1 && (
              <div className="h-px bg-border ml-[19px]" />
            )}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}