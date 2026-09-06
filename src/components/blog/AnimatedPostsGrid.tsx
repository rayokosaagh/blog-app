"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import TagIcon from "./TagIcon";
import type { TagColorMode } from "@/lib/sanitizeSvg";
import { sortTagsByOrder } from "@/lib/sortTags";
import Underline from "@/components/ui/Underline";
import CategoryBadge from "./CategoryBadge";
import { getPostCategory } from "@/lib/blog/categories";

interface PostItem {
  id: string;
  slug: string;
  title: string;
  content: string;
  featuredImage: string | null;
  createdAt: Date;
  tagOrder: string[];
  /** Post.category enum value; missing/unknown falls back to the default label. */
  category?: string | null;
  author: { name: string | null; image: string | null };
  tags: { id: string; slug: string; name: string; icon: string; colorMode?: TagColorMode | null; color?: string | null }[];
}

interface AnimatedPostsGridProps {
  posts: PostItem[];
  hasFilters: boolean;
  filterKey: string;
}

const PAGE_SIZE = 10;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function excerpt(html: string, len: number) {
  // Tags become a space, not "": stripping them bare fuses the last word of one
  // block onto the first of the next ("Nepal launchNothing has expanded...").
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, len);
}

/**
 * `eager` is for the lead story only. It's the largest image above the fold and
 * therefore the page's LCP element — lazy-loading it would delay the metric
 * rather than improve it. Everything else in the grid starts below the fold.
 */
function PostThumb({ post, eager = false }: { post: PostItem; eager?: boolean }) {
  return post.featuredImage ? (
    <img
      src={post.featuredImage}
      alt={post.title}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full bg-accent-tint flex items-center justify-center">
      <span className="text-2xl opacity-40">✦</span>
    </div>
  );
}

export default function AnimatedPostsGrid({
  posts,
  hasFilters,
  filterKey,
}: AnimatedPostsGridProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (posts.length === 0) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="empty-state"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-card border-2 border-border-heavy rounded-none p-16 text-center shadow-brutal"
        >
          <p className="text-5xl mb-4">📭</p>
          <p className="text-foreground text-lg font-bold mb-6">
            {hasFilters ? "No posts match these filters" : "No posts yet"}
          </p>
          <Link
            href={hasFilters ? "/blog" : "/products"}
            className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-border-heavy rounded-none text-accent font-extrabold text-xs uppercase tracking-wide shadow-brutal-sm brutal-press group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              ←
            </span>{" "}
            {hasFilters ? "View all posts" : "Browse gadgets"}
          </Link>
        </motion.div>
      </AnimatePresence>
    );
  }

  const lead = posts[0];
  const sideList = posts.slice(1, 5);
  const gridThree = posts.slice(5, 8);
  const rest = posts.slice(8);

  const visibleRest = rest.slice(0, visibleCount);
  const hasMore = visibleCount < rest.length;

  const leadTags = sortTagsByOrder(lead.tags, lead.tagOrder);
  const sideListIsFull = sideList.length >= 4;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={filterKey}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="flex flex-col gap-12"
      >
        {/* Magazine section — lead + side list + secondary grid */}
        <div className="flex flex-col gap-6">
          <div
            className={`grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6 ${
              sideListIsFull ? "items-stretch" : "items-start"
            }`}
          >
            {/* Lead story */}
            <motion.div
              variants={itemVariants}
              exit="exit"
              className="group bg-card border-2 border-border-heavy rounded-none overflow-hidden shadow-brutal-lg brutal-press-lg"
            >
              <Link href={`/blog/${lead.slug}`} className="flex flex-col h-full">
                <div className="overflow-hidden aspect-video border-b-2 border-border-heavy">
                  <PostThumb post={lead} eager />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3 text-xs">
                    <span className="bg-accent-2 text-on-accent-2 border-2 border-border-heavy px-2 py-0.5 font-extrabold uppercase tracking-wide">
                      Featured
                    </span>
                    {/* asSpan: we're already inside the card's <Link>. */}
                    <CategoryBadge category={lead.category} size="sm" asSpan />
                    <time className="text-muted-foreground">{formatDate(lead.createdAt)}</time>
                  </div>
                  <h2 className="text-2xl font-extrabold text-foreground leading-snug mb-3">
                    <Underline>{lead.title}</Underline>
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-5">
                    {excerpt(lead.content, 180)}...
                  </p>
                  <div className="mt-auto flex items-center gap-2.5 pt-5 border-t-2 border-border">
                    {lead.author.image ? (
                      <img
                        src={lead.author.image}
                        alt={lead.author.name ?? "Author"}
                        loading="lazy"
                        decoding="async"
                        className="w-8 h-8 rounded-none object-cover shrink-0 border-2 border-border-heavy"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-none bg-accent text-on-accent flex items-center justify-center font-extrabold text-xs shrink-0 border-2 border-border-heavy">
                        {lead.author.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-bold text-foreground/80 truncate">
                      {lead.author.name}
                    </span>
                    {leadTags[0] && (
                      <>
                        <span className="w-1 h-1 bg-border ml-1" />
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <TagIcon
                            icon={leadTags[0].icon}
                            colorMode={leadTags[0].colorMode}
                            color={leadTags[0].color}
                            className="inline-flex w-3 h-3 [&>svg]:w-full [&>svg]:h-full"
                          />
                          {leadTags[0].name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Side list — stretches to exactly match the lead story's height only when
                there are enough items (4) to fill it naturally; otherwise sizes to content
                and top-aligns, so 1–3 items don't get stretched into a huge empty card. */}
            {sideList.length > 0 && (
              <div className={`flex flex-col gap-3 ${sideListIsFull ? "h-full" : ""}`}>
                {sideList.map((post) => (
                  <motion.div
                    key={post.id}
                    variants={itemVariants}
                    exit="exit"
                    className={`group bg-card border-2 border-border-heavy rounded-none shadow-brutal-sm brutal-press ${
                      sideListIsFull ? "flex-1" : ""
                    }`}
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      className="flex items-center gap-3 h-full px-3 py-3"
                    >
                      <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden self-center border-2 border-border-heavy">
                        {post.featuredImage ? (
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-accent-tint flex items-center justify-center">
                            <span className="text-xl opacity-40">✦</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground mb-1">
                          <span className="font-extrabold uppercase tracking-wide text-accent">
                            {getPostCategory(post.category).singular}
                          </span>
                          <span className="mx-1.5">·</span>
                          {formatDate(post.createdAt)}
                        </p>
                        <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                          <Underline>{post.title}</Underline>
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Secondary uniform grid */}
          {gridThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {gridThree.map((post) => {
                const tags = sortTagsByOrder(post.tags, post.tagOrder);
                return (
                  <motion.div
                    key={post.id}
                    variants={itemVariants}
                    exit="exit"
                    className="group bg-card border-2 border-border-heavy rounded-none overflow-hidden shadow-brutal brutal-press"
                  >
                    <Link href={`/blog/${post.slug}`} className="flex flex-col h-full">
                      <div className="overflow-hidden aspect-[4/3] border-b-2 border-border-heavy">
                        <PostThumb post={post} />
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-2.5 text-xs text-muted-foreground">
                          <CategoryBadge category={post.category} size="sm" asSpan />
                          <time>{formatDate(post.createdAt)}</time>
                          {tags[0] && (
                            <>
                              <span className="w-1 h-1 bg-border" />
                              <span>{tags[0].name}</span>
                            </>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">
                          <Underline>{post.title}</Underline>
                        </h3>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* List with thumbnail — everything past the first 7, styled magazine-review style */}
        {rest.length > 0 && (
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground mb-2">
              More posts
            </p>
            <div className="flex flex-col">
              <AnimatePresence initial={false}>
                {visibleRest.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      className={`group flex items-center gap-5 py-5 ${
                        i === 0 ? "border-t-2 border-border" : ""
                      } border-b-2 border-border hover:bg-accent-tint transition-colors -mx-3 px-3`}
                    >
                      <div className="w-32 h-24 sm:w-40 sm:h-28 overflow-hidden flex-shrink-0 border-2 border-border-heavy">
                        <PostThumb post={post} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base sm:text-lg font-bold text-foreground leading-snug line-clamp-2 mb-2">
                          <Underline>{post.title}</Underline>
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          <span className="font-extrabold uppercase tracking-wide text-accent">
                            {getPostCategory(post.category).singular}
                          </span>
                          <span className="mx-1.5">·</span>
                          {post.author.name}
                          <span className="mx-1.5">·</span>
                          <span className="text-accent">
                            {formatDate(post.createdAt)}
                          </span>
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {hasMore && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-border-heavy rounded-none text-foreground font-extrabold text-xs uppercase tracking-wide shadow-brutal-sm brutal-press group"
                >
                  Uncover more posts
                  <span className="group-hover:translate-y-0.5 transition-transform">
                    ↓
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

const sectionVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
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