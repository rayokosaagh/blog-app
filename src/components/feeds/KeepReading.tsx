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

// Shared focus style — restores visible keyboard focus that the original
// `focus:outline-none` was silently dropping.
const FOCUS_RING = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

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
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
          Keep Reading
        </h2>

        <div className="flex items-center gap-3">
          <button
            onClick={prevSlide}
            className={`p-3.5 rounded-none border-2 border-border-heavy shadow-brutal-sm brutal-press hover:bg-accent hover:text-on-accent transition-colors ${FOCUS_RING}`}
            aria-label="Previous posts"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="square" strokeLinejoin="miter" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className={`p-3.5 rounded-none border-2 border-border-heavy shadow-brutal-sm brutal-press hover:bg-accent hover:text-on-accent transition-colors ${FOCUS_RING}`}
            aria-label="Next posts"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <Link href="/blog" className="text-xs font-extrabold uppercase tracking-wide text-accent hover:underline ml-4">
            View all posts →
          </Link>
        </div>
      </div>

      <div className="relative overflow-hidden">
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
                className={`group flex flex-col bg-card rounded-none overflow-hidden border-2 border-border-heavy shadow-brutal brutal-press ${FOCUS_RING}`}
              >
                <div className="w-full aspect-[4/3] overflow-hidden border-b-2 border-border-heavy relative">
                  {post.featuredImage ? (
                    <motion.img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.6 }}
                    />
                  ) : (
                    <div className="w-full h-full bg-accent-tint flex items-center justify-center">
                      <span className="text-2xl opacity-40">✦</span>
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-extrabold text-foreground leading-snug mb-3 line-clamp-2">
                    <span
                      className="box-decoration-clone bg-[length:0%_100%] group-hover:bg-[length:100%_100%] bg-no-repeat bg-left transition-[background-size] duration-100 ease-out group-hover:text-on-accent-2"
                      style={{ backgroundImage: "linear-gradient(var(--accent-2), var(--accent-2))" }}
                    >
                      {post.title}
                    </span>
                  </h3>
                  <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-bold text-foreground/80 truncate max-w-[120px]">
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

      {/* gap-0.5, not gap-2: each dot now carries its own 24px hit area, so
          the old 8px gap would push them visibly further apart. */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-0.5 mt-10">
          {Array.from({ length: totalPages }).map((_, idx) => (
            // The dot stays 12px; the button around it is padded out to the
            // 24x24 WCAG 2.2 minimum target size. Growing the dot instead would
            // wreck the visual rhythm — pad the hit area, not the mark.
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to page ${idx + 1}`}
              aria-current={idx === currentIndex ? "true" : undefined}
              className={`group inline-flex h-6 w-6 items-center justify-center ${FOCUS_RING}`}
            >
              <span
                className={`h-3 w-3 rounded-none border-2 border-border-heavy transition-all duration-200 ${
                  idx === currentIndex
                    ? "bg-accent-2 scale-125"
                    : "bg-card group-hover:bg-accent-2"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}