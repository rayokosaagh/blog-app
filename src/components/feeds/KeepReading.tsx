"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  featuredImage?: string | null;
  createdAt: string | Date;
  author: { name: string | null };
}

interface KeepReadingProps {
  relatedPosts: RelatedPost[];
}

export default function KeepReading({ relatedPosts = [] }: KeepReadingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const postsPerPage = 3;
  const totalPages = Math.max(1, Math.ceil(relatedPosts.length / postsPerPage));

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % totalPages);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);

  const currentPosts = relatedPosts.slice(
    currentIndex * postsPerPage,
    (currentIndex + 1) * postsPerPage
  );

  if (relatedPosts.length === 0) {
    return <div className="py-12 text-center text-muted-foreground">No related posts yet.</div>;
  }

  return (
    <section className="w-full max-w-5xl mx-auto px-6 py-12 mb-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Keep Reading
        </h2>

        <div className="flex items-center gap-3">
          <button
            onClick={prevSlide}
            className="p-3.5 rounded-2xl border border-border hover:bg-[#6f42c1] hover:text-white hover:border-[#6f42c1] transition-all duration-200 active:scale-95 focus:outline-none"
            aria-label="Previous posts"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="p-3.5 rounded-2xl border border-border hover:bg-[#6f42c1] hover:text-white hover:border-[#6f42c1] transition-all duration-200 active:scale-95 focus:outline-none"
            aria-label="Next posts"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <Link href="/blog" className="text-sm font-medium text-accent hover:underline ml-4">
            View all posts →
          </Link>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {currentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col bg-card rounded-2xl overflow-hidden border border-border hover:border-accent hover:shadow-xl transition-all duration-300"
              >
                <div className="w-full aspect-[4/3] overflow-hidden bg-muted relative">
                  {post.featuredImage ? (
                    <motion.img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.6 }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/40 dark:to-indigo-800/30" />
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-foreground leading-snug mb-3 line-clamp-2 group-hover:text-accent transition-colors">
                    {post.title}
                  </h3>
                  <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80 truncate max-w-[120px]">
                      {post.author.name || "Anonymous"}
                    </span>
                    <span>
                      {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(post.createdAt))}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "bg-[#6f42c1] scale-125" : "bg-border hover:bg-[#6f42c1]/70"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}