// src/components/blog/SearchEmptyState.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function SearchEmptyState({ query }: { query: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="empty-state"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-card border border-border rounded-3xl p-16 text-center shadow-sm dark:shadow-none"
      >
        <motion.p
          className="text-5xl mb-4 inline-block"
          initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: [0, -6, 6, -4, 4, 0],
            y: [0, -6, 0],
          }}
          transition={{
            opacity: { duration: 0.3 },
            scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
            rotate: { duration: 1.1, delay: 0.15, ease: "easeInOut" },
            y: {
              duration: 2.2,
              delay: 1.3,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            },
          }}
        >
          📭
        </motion.p>
        <p className="text-foreground text-lg font-medium mb-6">
          {query ? `No posts match "${query}"` : "Type at least 2 characters to search"}
        </p>
        {query && (
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600/10 hover:bg-blue-600/15 dark:bg-blue-400/10 dark:hover:bg-blue-400/15 rounded-full text-blue-600 dark:text-blue-400 font-medium text-sm transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>{" "}
            View all posts
          </Link>
        )}
      </motion.div>
    </AnimatePresence>
  );
}