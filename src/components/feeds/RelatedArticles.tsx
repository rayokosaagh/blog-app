"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { getExcerpt, formatRelativeTime, getReadingTime } from "@/lib/postUtils";
import Underline from "@/components/ui/Underline";

interface RelatedArticleAuthor {
  name: string | null;
  image: string | null;
}

interface RelatedArticleTag {
  id: string;
  name: string;
  slug: string;
}

interface RelatedArticlePost {
  id: string;
  title: string;
  slug: string;
  content: string;
  featuredImage: string | null;
  createdAt: Date | string;
  author: RelatedArticleAuthor;
  tags?: RelatedArticleTag[];
}

interface RelatedArticlesProps {
  posts: RelatedArticlePost[];
  /** Optional heading override. Defaults to "More Articles". */
  heading?: string;
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FeaturedCard({ post }: { post: RelatedArticlePost }) {
  const shouldReduceMotion = useReducedMotion();
  const href = `/blog/${post.slug}`;
  const excerpt = getExcerpt(post.content, 34);
  const readingTime = getReadingTime(post.content);
  const primaryTag = post.tags?.[0];

  const variants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <motion.div variants={variants}>
      <article className="group rounded-none border-2 border-border-heavy bg-card overflow-hidden shadow-brutal-lg brutal-press-lg">
        <Link href={href} className="relative block aspect-[16/10] overflow-hidden bg-muted">
          {post.featuredImage ? (
            <img loading="lazy" decoding="async" src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-accent-tint" />
          )}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
            {primaryTag ? (
              <span className="inline-flex items-center bg-accent-2 text-on-accent-2 border-2 border-border-heavy text-xs font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-none">
                {primaryTag.name}
              </span>
            ) : (
              <span />
            )}
            <span className="inline-flex items-center bg-background text-foreground border-2 border-border-heavy text-xs font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-none">
              {readingTime} min read
            </span>
          </div>
        </Link>

        <div className="p-6 md:p-8">
          <Link href={href} className="block">
            <h3 className="text-2xl md:text-[28px] font-extrabold text-foreground leading-snug mb-3 transition-colors duration-100 group-hover:text-accent">
              <Underline>{post.title}</Underline>
            </h3>
          </Link>

          <p className="text-muted-foreground leading-relaxed text-[15px] mb-6">{excerpt}</p>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-none overflow-hidden bg-accent-tint shrink-0 border-2 border-border-heavy">
                {post.author.image ? (
                  <img loading="lazy" decoding="async" src={post.author.image} alt={post.author.name || "Author"} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-accent flex items-center justify-center text-on-accent font-extrabold text-xs">
                    {post.author.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{post.author.name}</p>
                <p className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)}</p>
              </div>
            </div>

            <Link
              href={href}
              className="group/btn inline-flex items-center gap-1.5 text-sm font-bold text-accent shrink-0"
            >
              Read more
              <ArrowIcon className="w-4 h-4 transition-transform duration-150 group-hover/btn:translate-x-1" />
            </Link>
          </div>
        </div>
      </article>
    </motion.div>
  );
}

function ListItem({ post }: { post: RelatedArticlePost }) {
  const shouldReduceMotion = useReducedMotion();
  const href = `/blog/${post.slug}`;
  const primaryTag = post.tags?.[0];

  const variants: Variants = {
    hidden: { opacity: 0, x: shouldReduceMotion ? 0 : 16 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
  };

  return (
    <motion.div variants={variants}>
      <Link
        href={href}
        className="group flex items-start gap-4 py-4 px-2 -mx-2 rounded-none transition-colors duration-100 hover:bg-accent-tint"
      >
        <div className="relative w-24 h-[68px] md:w-28 md:h-20 rounded-none overflow-hidden shrink-0 bg-muted border-2 border-border-heavy">
          {post.featuredImage ? (
            <img loading="lazy" decoding="async" src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-accent-tint" />
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          {primaryTag && (
            <p className="text-xs font-extrabold uppercase tracking-wide text-accent mb-1">
              {primaryTag.name}
            </p>
          )}
          <h4 className="text-[15px] font-extrabold text-foreground leading-snug line-clamp-2 transition-colors duration-100 group-hover:text-accent">
            <Underline>{post.title}</Underline>
          </h4>
          <p className="text-xs text-muted-foreground mt-1.5 truncate">
            {post.author.name} · {formatRelativeTime(post.createdAt)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export default function RelatedArticles({ posts, heading = "More Articles" }: RelatedArticlesProps) {
  const shouldReduceMotion = useReducedMotion();
  if (!posts || posts.length === 0) return null;

  const [featured, ...rest] = posts;
  const listItems = rest.slice(0, 4);
  const seeAllHref = featured.tags?.[0] ? `/blog?tag=${featured.tags[0].slug}` : "/blog";

  const listContainerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.05, delayChildren: 0.1 } },
  };

  return (
    <section className="w-full max-w-6xl mx-auto px-6 mb-16 md:mb-20">
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex items-end justify-between gap-4 mb-8"
      >
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-accent mb-1.5">On this topic</p>
          <h2 className="text-2xl md:text-3xl font-black text-foreground">{heading}</h2>
        </div>
        <Link
          href={seeAllHref}
          className="group/all hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-accent transition-colors duration-100 shrink-0 pb-1"
        >
          View all
          <ArrowIcon className="w-4 h-4 transition-transform duration-150 group-hover/all:translate-x-1" />
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8 lg:gap-10 items-start">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <FeaturedCard post={featured} />
        </motion.div>

        {listItems.length > 0 && (
          <motion.div
            variants={listContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="flex flex-col divide-y-2 divide-border lg:border-l-2 lg:border-border lg:pl-8 lg:divide-y-0 lg:[&>div]:border-b-2 lg:[&>div]:border-border lg:[&>div:last-child]:border-b-0"
          >
            {listItems.map((post) => (
              <ListItem key={post.id} post={post} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}