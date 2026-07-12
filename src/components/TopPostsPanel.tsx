// components/TopPostsPanel.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";

interface TopPost {
  id: string;
  title: string;
  slug: string;
  views: number;
  published: boolean;
}

export default function TopPostsPanel({ posts }: { posts: TopPost[] }) {
  const maxViews = Math.max(...posts.map((p) => p.views), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.28 }}
      className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3
          className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Top posts by views
        </h3>
        <Link
          href="/dashboard/posts"
          className="text-blue-500 hover:text-blue-600 text-xs font-medium transition-colors"
        >
          View all →
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-zinc-400 py-8 text-center">No posts yet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post, i) => (
            <div key={post.id} className="flex items-center gap-4">
              <span
                className="text-sm text-zinc-400 dark:text-zinc-600 w-5 shrink-0 tabular-nums"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                    {post.title}
                  </p>
                  <span
                    className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 shrink-0 tabular-nums"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    <Eye className="h-3 w-3" />
                    {post.views.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(post.views / maxViews) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.3 + i * 0.05, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}