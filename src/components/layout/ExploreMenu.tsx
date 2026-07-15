"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Search, X, ChevronDown, ArrowRight } from "lucide-react";
import TagIcon from "@/components/blog/TagIcon";

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  featuredImage?: string | null;
};

type TagItem = {
  id: string;
  name: string;
  slug: string;
  icon: string;
};

const MIN_QUERY_LENGTH = 2;

interface ExploreMenuProps {
  variant?: "dropdown" | "inline";
  onNavigate?: () => void;
}

export default function ExploreMenu({ variant = "dropdown", onNavigate }: ExploreMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const trimmedQuery = query.trim();
  const isQueryTooShort = trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY_LENGTH;
  const showResults = trimmedQuery.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (variant !== "dropdown") return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [variant]);

  useEffect(() => {
    if (!isOpen || tagsLoaded || tagsLoading) return;
    setTagsLoading(true);
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => {
        setTags(Array.isArray(data) ? data : []);
        setTagsLoaded(true);
      })
      .catch((err) => console.error("Failed to load categories:", err))
      .finally(() => setTagsLoading(false));
  }, [isOpen, tagsLoaded, tagsLoading]);

  useEffect(() => {
    if (!isOpen || trimmedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error("Explore search error:", err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [trimmedQuery, isOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    onNavigate?.();
  }, [onNavigate]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && trimmedQuery.length >= MIN_QUERY_LENGTH) {
      router.push(`/blog?search=${encodeURIComponent(trimmedQuery)}`);
      close();
    }
  };

  const panelContent = (
    <>
      {/* Search field */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          autoFocus={variant === "dropdown"}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search all posts..."
          className="w-full pl-10 pr-9 py-2.5 text-sm
                     bg-background
                     border-[1.5px] border-border-heavy
                     text-foreground
                     placeholder-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-accent/40
                     transition-colors"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Body: live search results, or the category browser when idle */}
      <div className="mt-3 min-h-[64px]">
        <AnimatePresence mode="wait">
          {showResults ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {isSearching ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                </div>
              ) : results.length > 0 ? (
                <ul className="space-y-1 max-h-72 overflow-y-auto pr-1">
                  {results.map((post, i) => (
                    <motion.li
                      key={post.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                    >
                      <Link
                        href={`/blog/${post.slug}`}
                        onClick={close}
                        className="flex items-center gap-3 px-2.5 py-2 hover:bg-accent-tint transition-colors group"
                      >
                        {post.featuredImage ? (
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-9 h-9 object-cover flex-shrink-0 border-[1.5px] border-border-heavy"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-accent-tint flex items-center justify-center flex-shrink-0 text-base border-[1.5px] border-border-heavy">
                            📝
                          </div>
                        )}
                        <span className="text-sm text-foreground group-hover:text-accent font-medium line-clamp-1">
                          {post.title}
                        </span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {isQueryTooShort
                    ? `Type at least ${MIN_QUERY_LENGTH} characters to search`
                    : `No posts found for "${trimmedQuery}"`}
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="categories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="px-0.5 pb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Browse by category
              </p>
              {tagsLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 bg-accent-tint animate-pulse border-[1.5px] border-border" />
                  ))}
                </div>
              ) : tags.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {tags.map((tag, i) => (
                    <motion.div
                      key={tag.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.025, duration: 0.2 }}
                    >
                      <Link
                        href={`/blog?tag=${tag.slug}`}
                        onClick={close}
                        className="flex items-center gap-2 px-3 py-2.5 bg-background hover:bg-accent-tint border-[1.5px] border-border-heavy transition-colors group"
                      >
                        <TagIcon
                          icon={tag.icon}
                          className="inline-flex w-4 h-4 flex-shrink-0 [&>svg]:w-full [&>svg]:h-full text-muted-foreground group-hover:text-accent"
                        />
                        <span className="text-sm text-foreground group-hover:text-accent font-medium truncate">
                          {tag.name}
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No categories yet
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <Link
        href="/blog"
        onClick={close}
        className="mt-3 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold uppercase tracking-wide text-accent hover:bg-accent-tint transition-colors border-[1.5px] border-border-heavy"
      >
        View all posts
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </>
  );

  if (variant === "inline") {
    return (
      <div ref={containerRef} className="w-full">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 text-foreground hover:text-accent hover:bg-accent-tint transition-colors"
        >
          <Compass className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left truncate">Explore</span>
          <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="px-3 pt-1 pb-2">{panelContent}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <motion.button
        onClick={() => setIsOpen((v) => !v)}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        className={`relative flex items-center gap-1.5 px-4 py-2 whitespace-nowrap transition-colors border-[1.5px] ${
          isOpen
            ? "text-accent border-border-heavy bg-accent-tint"
            : "text-foreground border-transparent hover:text-accent hover:border-border-heavy"
        }`}
      >
        <Compass className="relative h-4 w-4" />
        <span className="relative">Explore</span>
        <motion.span className="relative" animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute left-0 mt-3 w-[22rem] origin-top-left"
          >
            <div className="relative overflow-hidden bg-card border-[1.5px] border-border-heavy">
              <div className="relative p-4">{panelContent}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}