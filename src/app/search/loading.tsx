// src/app/search/loading.tsx
"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";

function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md"
    >
      <div className="aspect-video w-full bg-gray-200/70 dark:bg-white/10 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-3.5 w-5/6 rounded-full bg-gray-200/70 dark:bg-white/10 animate-pulse" />
        <div className="h-3.5 w-2/3 rounded-full bg-gray-200/70 dark:bg-white/10 animate-pulse" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-3 w-16 rounded-full bg-gray-200/70 dark:bg-white/10 animate-pulse" />
          <div className="h-3 w-12 rounded-full bg-gray-200/70 dark:bg-white/10 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}

export default function SearchLoading() {
  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="h-7 w-48 rounded-full bg-gray-200/70 dark:bg-white/10 animate-pulse mb-3" />
          <div className="h-4 w-64 rounded-full bg-gray-200/70 dark:bg-white/10 animate-pulse mb-8" />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} index={i} />
          ))}
        </div>
      </main>
    </>
  );
}