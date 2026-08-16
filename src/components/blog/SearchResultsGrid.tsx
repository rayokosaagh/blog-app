// src/components/blog/SearchResultsGrid.tsx
"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Underline from "@/components/ui/Underline";

type SearchPost = {
  id: string;
  title: string;
  slug: string;
  featuredImage: string | null;
  createdAt: Date;
  author: { name: string | null } | null;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

const sectionVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18, ease: "easeIn" as const },
  },
};

export default function SearchResultsGrid({
  posts,
  filterKey,
}: {
  posts: SearchPost[];
  filterKey: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={filterKey}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {posts.map((post) => (
          // Outer element: entrance animation only (position + opacity).
          <motion.div key={post.id} variants={itemVariants} exit="exit" className="h-full">
            {/* Inner element: press feedback only, no Framer transform props,
                so brutal-press's CSS :hover isn't fought by an inline transform. */}
            <div className="group bg-card border-2 border-border-heavy rounded-none shadow-brutal brutal-press overflow-hidden h-full">
              <Link href={`/blog/${post.slug}`} className="flex flex-col h-full">
                <div className="aspect-video w-full bg-accent-tint overflow-hidden border-b-2 border-border-heavy">
                  {post.featuredImage ? (
                    <img loading="lazy" decoding="async"
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      📝
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
<h2 className="text-sm font-bold text-foreground line-clamp-2 mb-2">
  <Underline>{post.title}</Underline>
</h2>

                  <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-2">
                    <span className="truncate">{post.author?.name ?? "Unknown"}</span>
                    <span className="flex-shrink-0 ml-2">{formatDate(post.createdAt)}</span>
                  </div>
                </div>
              </Link>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}