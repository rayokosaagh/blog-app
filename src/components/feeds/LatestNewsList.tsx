"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import Underline from "@/components/ui/Underline";

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
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
  },
};

// NOTE: This component renders CONTENT ONLY — no outer border/shadow/bg-card
// of its own. The caller supplies the bordered, shadowed card frame around
// <LatestNewsList />. Row treatment (badge, press-thumbnail, hover fill,
// divider) is intentionally mirrored from <TrendingNewsList /> so the two
// sidebar cards read as one family rather than two different components.
export default function LatestNewsList({ posts }: LatestNewsListProps) {
  if (posts.length === 0) return null;

  return (
    <div>
      {/* Eyebrow / icon chip label */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-6 h-6 flex items-center justify-center bg-accent-2 border-2 border-border-heavy shrink-0">
          <Clock className="w-3.5 h-3.5 text-on-accent-2" />
        </div>
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-accent">
          Latest News
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
              className="group relative flex items-center gap-3.5 py-3 -mx-2 px-2 transition-colors duration-100 ease-linear hover:bg-accent-tint"
            >
              {/* Rank badge — numbered to match Trending News */}
              <span
                className="flex items-center justify-center w-7 h-7 shrink-0 border-2 border-border-heavy bg-accent text-on-accent text-xs font-extrabold shadow-brutal-sm transition-all duration-150 ease-out group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none"
                aria-hidden
              >
                {i + 1}
              </span>

              {/* Thumbnail: hard-bordered block that "presses" on hover, flips from grayscale to full color */}
              <div className="w-14 h-14 overflow-hidden shrink-0 bg-border border-2 border-border-heavy shadow-brutal-sm transition-all duration-150 ease-out group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none">
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover grayscale contrast-[1.05] transition-all duration-200 ease-out group-hover:grayscale-0"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-accent-tint">
                    <span className="text-lg">📝</span>
                  </div>
                )}
              </div>

              {/* Title + date */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                  <Underline>{post.title}</Underline>
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-[2px] w-3 bg-border-heavy shrink-0" />
                  <p className="text-xs font-medium text-muted-foreground">
                    {formatDate(post.createdAt)}
                  </p>
                </div>
              </div>
            </Link>

            {/* Flat divider between rows, skipped after the last item */}
            {i < posts.length - 1 && (
              <div className="h-[1.5px] bg-border ml-[46px]" />
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}