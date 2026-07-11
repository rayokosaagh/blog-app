"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import TagIcon from "./TagIcon";
import { sortTagsByOrder } from "@/lib/sortTags";

interface PostItem {
  id: string;
  slug: string;
  title: string;
  content: string;
  featuredImage: string | null;
  createdAt: Date;
  tagOrder: string[];
  author: { name: string | null; image: string | null };
  tags: { id: string; slug: string; name: string; icon: string }[];
}

interface AnimatedPostsGridProps {
  posts: PostItem[];
  hasFilters: boolean;
  filterKey: string;
  /**
   * TEMP / DEV ONLY: pads the "More posts" list with placeholder posts so the
   * load-more pagination can be tested even if the real post list is short.
   * Set to false (or delete the generateDummyPosts call below) before shipping.
   */
  showDemoPosts?: boolean;
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
  return html.replace(/<[^>]*>/g, "").substring(0, len);
}

// --- DEV ONLY: dummy posts so "More posts" + load-more can be tested locally ---
function generateDummyPosts(count: number, offset: number): PostItem[] {
  const sampleTitles = [
    "Redmi Note 15 Pro Plus Review: Is it the best value for the price?",
    "Galaxy Tab S11 Review: A worthy iPad rival?",
    "5 budget earbuds that actually sound premium",
    "How to pick a laptop that will last five years",
    "OnePlus 13R long-term review: six months later",
    "The best mechanical keyboards under $100",
    "Why fast charging is finally standard in 2026",
    "Foldable phones: gimmick or the future?",
    "Mirrorless vs DSLR: which should you buy today",
    "The quiet return of the compact camera",
  ];
  const authors = ["Yural Maskey", "Priya Shah", "Daniel Ortiz", "Mei Lin"];
  return Array.from({ length: count }).map((_, i) => {
    const n = offset + i;
    return {
      id: `dummy-${n}`,
      slug: `dummy-post-${n}`,
      title: sampleTitles[n % sampleTitles.length],
      content: "<p>Sample placeholder content used for testing the load more pagination.</p>",
      featuredImage: null,
      createdAt: new Date(2026, 0, ((n * 3) % 27) + 1),
      tagOrder: [],
      author: { name: authors[n % authors.length], image: null },
      tags: [],
    };
  });
}
// --- end dev-only block ---

function PostThumb({ post }: { post: PostItem }) {
  return post.featuredImage ? (
    <img
      src={post.featuredImage}
      alt={post.title}
      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
    />
  ) : (
    <div className="w-full h-full bg-blue-500/10 flex items-center justify-center">
      <span className="text-2xl opacity-40">✦</span>
    </div>
  );
}

function Underline({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-[linear-gradient(to_right,#2563EB,#2563EB)] dark:bg-[linear-gradient(to_right,#60A5FA,#60A5FA)] bg-no-repeat bg-[length:0%_1px] group-hover:bg-[length:100%_1px] bg-[position:0_100%] transition-[background-size] duration-500 pb-0.5">
      {children}
    </span>
  );
}

export default function AnimatedPostsGrid({
  posts,
  hasFilters,
  filterKey,
  showDemoPosts = true,
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
          className="bg-card border border-border rounded-3xl p-16 text-center shadow-sm dark:shadow-none"
        >
          <p className="text-5xl mb-4">📭</p>
          <p className="text-foreground text-lg font-medium mb-6">
            {hasFilters ? "No posts match these filters" : "No posts yet"}
          </p>
          {hasFilters && (
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600/10 hover:bg-blue-600/15 dark:bg-blue-400/10 dark:hover:bg-blue-400/15 rounded-full text-blue-600 dark:text-blue-400 font-medium text-sm transition-colors group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">
                ←
              </span>{" "}
              View all posts
            </Link>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  const lead = posts[0];
  const sideList = posts.slice(1, 5);
  const gridThree = posts.slice(5, 8);
  let rest = posts.slice(8);

  // DEV ONLY: pad the list so there's enough to click through "load more" with.
  // Remove this block (and the showDemoPosts prop) once real data is sufficient.
  if (showDemoPosts && rest.length < 25) {
    rest = [...rest, ...generateDummyPosts(25 - rest.length, rest.length)];
  }

  const visibleRest = rest.slice(0, visibleCount);
  const hasMore = visibleCount < rest.length;

  const leadTags = sortTagsByOrder(lead.tags, lead.tagOrder);

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
          <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6 items-stretch">
            {/* Lead story */}
            <motion.div
              variants={itemVariants}
              exit="exit"
              className="group bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-xl dark:shadow-none transition-shadow duration-300"
            >
              <Link href={`/blog/${lead.slug}`} className="flex flex-col h-full">
                <div className="overflow-hidden rounded-3xl m-2 mb-0 aspect-video">
                  <div className="w-full h-full rounded-2xl overflow-hidden">
                    <PostThumb post={lead} />
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide">
                      Featured
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <time>{formatDate(lead.createdAt)}</time>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground leading-snug mb-3">
                    <Underline>{lead.title}</Underline>
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-5">
                    {excerpt(lead.content, 180)}...
                  </p>
                  <div className="mt-auto flex items-center gap-2.5 pt-5 border-t border-border">
                    {lead.author.image ? (
                      <img
                        src={lead.author.image}
                        alt={lead.author.name ?? "Author"}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-600/10 dark:bg-blue-400/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs shrink-0">
                        {lead.author.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-foreground/80 truncate">
                      {lead.author.name}
                    </span>
                    {leadTags[0] && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-border ml-1" />
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <TagIcon
                            icon={leadTags[0].icon}
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

            {/* Side list — stretches to exactly match the lead story's height, thumbnails stay fixed-size and undistorted */}
            {sideList.length > 0 && (
              <div className="flex flex-col gap-3 h-full">
                {sideList.map((post) => (
                  <motion.div
                    key={post.id}
                    variants={itemVariants}
                    exit="exit"
                    className="group bg-card rounded-2xl shadow-sm hover:shadow-md dark:shadow-none transition-shadow duration-300 flex-1"
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      className="flex items-center gap-3 h-full px-3"
                    >
                      <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl self-center">
                        {post.featuredImage ? (
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                            <span className="text-xl opacity-40">✦</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground mb-1">
                          {formatDate(post.createdAt)}
                        </p>
                        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
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
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    className="group bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-xl dark:shadow-none transition-shadow duration-300"
                  >
                    <Link href={`/blog/${post.slug}`} className="flex flex-col h-full">
                      <div className="overflow-hidden rounded-3xl m-2 mb-0 aspect-[4/3]">
                        <div className="w-full h-full rounded-2xl overflow-hidden">
                          <PostThumb post={post} />
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-2.5 text-xs text-muted-foreground">
                          <time>{formatDate(post.createdAt)}</time>
                          {tags[0] && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span>{tags[0].name}</span>
                            </>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-foreground leading-snug line-clamp-2">
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
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
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
                        i === 0 ? "border-t border-border" : ""
                      } border-b border-border hover:bg-foreground/[0.02] transition-colors -mx-3 px-3 rounded-xl`}
                    >
                      <div className="w-32 h-24 sm:w-40 sm:h-28 rounded-2xl overflow-hidden flex-shrink-0">
                        <PostThumb post={post} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base sm:text-lg font-bold text-foreground leading-snug line-clamp-2 mb-2">
                          <Underline>{post.title}</Underline>
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {post.author.name}
                          <span className="mx-1.5">·</span>
                          <span className="text-blue-600 dark:text-blue-400">
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
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600/10 hover:bg-blue-600/15 dark:bg-blue-400/10 dark:hover:bg-blue-400/15 rounded-full text-blue-600 dark:text-blue-400 font-medium text-sm transition-colors group"
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