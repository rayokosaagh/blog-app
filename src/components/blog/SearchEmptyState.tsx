// src/components/blog/SearchEmptyState.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Inbox } from "lucide-react";

export default function SearchEmptyState({ query }: { query: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="empty-state"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="bg-card border-2 border-border-heavy rounded-none shadow-brutal-lg p-16 text-center"
      >
        <motion.div
          className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-none border-2 border-border-heavy bg-accent-tint"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <Inbox className="w-7 h-7 stroke-current text-foreground" strokeWidth={2} />
        </motion.div>
        <p className="text-foreground text-lg font-bold mb-6">
          {query ? `No posts match "${query}"` : "Type at least 2 characters to search"}
        </p>
        {query && (
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 border-2 border-border-heavy rounded-none bg-accent text-on-accent shadow-brutal-sm brutal-press px-5 py-2.5 font-extrabold uppercase tracking-wide text-xs"
          >
            <span>←</span> View all posts
          </Link>
        )}
      </motion.div>
    </AnimatePresence>
  );
}