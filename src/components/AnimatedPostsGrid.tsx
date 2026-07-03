"use client";

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
  // Changes whenever the active filters change — forces AnimatePresence to
  // treat the result set as "new" and replay the reveal / exit animation.
  filterKey: string;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

const gridVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { duration: 0.2, ease: "easeIn" as const },
  },
};

export default function AnimatedPostsGrid({
  posts,
  hasFilters,
  filterKey,
}: AnimatedPostsGridProps) {
  return (
    <AnimatePresence mode="wait">
      {posts.length === 0 ? (
        <motion.div
          key="empty-state"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-card border border-border rounded-2xl p-16 text-center shadow-sm dark:shadow-none"
        >
          <p className="text-5xl mb-4">📭</p>
          <p className="text-foreground text-lg font-medium mb-6">
            {hasFilters ? "No posts match these filters" : "No posts yet"}
          </p>
          {hasFilters && (
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground/5 hover:bg-foreground/10 rounded-full text-muted-foreground hover:text-foreground font-medium text-sm transition-colors group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">
                ←
              </span>{" "}
              View all posts
            </Link>
          )}
        </motion.div>
      ) : (
        <motion.div
          key={filterKey}
          variants={gridVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {posts.map((post) => {
            const orderedTags = sortTagsByOrder(post.tags, post.tagOrder);
            return (
              <motion.div
                key={post.id}
                variants={cardVariants}
                exit="exit"
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="group bg-card rounded-2xl overflow-hidden hover:shadow-xl dark:hover:shadow-none transition-shadow duration-300 flex flex-col border border-border"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="overflow-hidden">
                    {post.featuredImage ? (
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-52 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/40 dark:to-indigo-800/30 flex items-center justify-center">
                        <span className="text-5xl">📝</span>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-accent text-xs font-semibold uppercase tracking-wide">
                      Blog
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                  </div>

                  <Link href={`/blog/${post.slug}`} className="block">
                    <h2 className="text-base font-bold text-foreground group-hover:text-accent transition-colors leading-snug mb-3 line-clamp-3">
                      {post.title}
                    </h2>
                  </Link>

                  <Link href={`/blog/${post.slug}`} className="block">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                      {post.content.replace(/<[^>]*>/g, "").substring(0, 120)}
                      ...
                    </p>
                  </Link>

                  {orderedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {orderedTags.slice(0, 3).map((t) => (
                        <Link
                          key={t.id}
                          href={`/blog?tag=${t.slug}`}
                          className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          <TagIcon
                            icon={t.icon}
                            className="inline-flex w-3.5 h-3.5 [&>svg]:w-full [&>svg]:h-full"
                          />
                          <span>{t.name}</span>
                        </Link>
                      ))}
                      {orderedTags.length > 3 && (
                        <span className="inline-flex items-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-medium px-2 py-0.5 rounded-full">
                          +{orderedTags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-auto flex items-center gap-2 pt-4 border-t border-border"
                  >
                    {post.author.image ? (
                      <img
                        src={post.author.image}
                        alt={post.author.name ?? "Author"}
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs shrink-0">
                        {post.author.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-0">
                      <span className="font-medium text-foreground/80 truncate">
                        {post.author.name}
                      </span>
                      <span className="mx-1 shrink-0">·</span>
                      <time className="shrink-0">
                        {formatDate(post.createdAt)}
                      </time>
                    </div>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}