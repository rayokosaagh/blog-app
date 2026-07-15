// components/DashboardClient.tsx
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  createdAt: string;
  author: { name: string };
}

interface DashboardClientProps {
  initialRecentPosts: Post[];
}

export default function DashboardClient({ initialRecentPosts }: DashboardClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filteredPosts = useMemo(() => {
    return initialRecentPosts.filter((post) => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PUBLISHED" && post.published) ||
        (statusFilter === "DRAFT" && !post.published);
      return matchesSearch && matchesStatus;
    });
  }, [initialRecentPosts, searchTerm, statusFilter]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
      <div className="h-1 bg-blue-500" />

      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
        <h2
          className="text-base font-bold text-zinc-900 dark:text-zinc-50"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Recent posts
        </h2>
        <Link
          href="/dashboard/posts"
          className="text-blue-500 hover:text-blue-600 text-xs font-semibold transition-colors"
        >
          View all →
        </Link>
      </div>

      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowFilterDropdown((s) => !s)}
            className="w-full sm:w-40 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-700 dark:text-zinc-200 flex justify-between items-center hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            {statusFilter === "ALL" ? "All posts" : statusFilter === "PUBLISHED" ? "Published" : "Drafts"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showFilterDropdown ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showFilterDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-40 bg-white dark:bg-zinc-800 rounded-xl shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-700 py-1.5 z-50"
              >
                {(["ALL", "PUBLISHED", "DRAFT"] as const).map((val) => (
                  <div
                    key={val}
                    onClick={() => {
                      setStatusFilter(val);
                      setShowFilterDropdown(false);
                    }}
                    className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                      statusFilter === val
                        ? "text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-500/10"
                        : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                    }`}
                  >
                    {val === "ALL" ? "All posts" : val === "PUBLISHED" ? "Published" : "Drafts"}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="max-h-[420px] overflow-auto">
        <AnimatePresence mode="popLayout">
          {filteredPosts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center text-sm text-zinc-400"
            >
              No posts match that search.
            </motion.div>
          ) : (
            filteredPosts.map((post, i) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="p-5 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {post.title}
                    </p>
                    <p
                      className="text-xs text-zinc-500 dark:text-zinc-500 mt-1"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {post.author.name} · {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full self-start shrink-0 ${
                      post.published
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {post.published ? "Live" : "Draft"}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}