// src/components/blog/SearchResultsGrid.tsx
"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
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
          <motion.div
            key={post.id}
            variants={itemVariants}
            exit="exit"
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="group bg-white/60 dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300"
          >
            <Link href={`/blog/${post.slug}`} className="flex flex-col h-full">
              <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    📝
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h2 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {post.title}
                </h2>
                <div className="mt-auto flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2">
                  <span className="truncate">{post.author?.name ?? "Unknown"}</span>
                  <span className="flex-shrink-0 ml-2">{formatDate(post.createdAt)}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}