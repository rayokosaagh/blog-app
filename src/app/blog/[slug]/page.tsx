import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TocSidebar from "@/components/TocSidebar";
import SocialSidebar from "@/components/layout/SocialSidebar";
import type { Metadata } from "next";
import MobileNav from "@/components/layout/MobileNav";
import BackToTop from "@/components/ui/BackToTop";
import Poll from "@/components/Poll";
import RatingMeter from "@/components/RatingMeter";
import KeepReading from "@/components/KeepReading";
import CommentSection from "@/components/CommentSection";
import RelatedArticles from "@/components/RelatedArticles";
import TagIcon from "@/components/TagIcon";
import { sortTagsByOrder } from "@/lib/sortTags";
import ViewTracker from "@/components/ViewTracker";
import { FadeIn } from "@/components/ui/AnimatedSection";
import { ArrowLeft, Clock } from "lucide-react";
import ReadingProgressBar from "@/components/ui/ReadingProgressBar";
import ParallaxHeroImage from "@/components/ui/ParallaxHeroImage";
import ArticleImageLightbox from "@/components/ArticleImageLightbox";
import { auth } from "@/auth";
import BookmarkButton from "@/components/BookmarkButton";
import { parseKeyHighlightsBlock } from "@/components/KeyHighlights";
import { parseAlsoReadBlock } from "@/components/AlsoRead";
import AlsoReadMount from "@/components/AlsoReadMount";
import KeyHighlightsMount from "@/components/KeyHighlightsMount";
import { parseDropCapLedeBlock } from "@/components/DropCapLede";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

interface TocItem {
  text: string;
  id: string;
  level: "h1" | "h2" | "h3" | "h4";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function splitIntoParagraphs(html: string): string[] {
  const parts = html.split(/(?<=<\/p>|<\/h[1-6]>|<\/ul>|<\/ol>|<\/blockquote>)/i);
  return parts.filter((p) => p.trim().length > 0);
}

function parseContentAndGenerateToc(html: string): { modifiedHtml: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const seenIds = new Map<string, number>();

  const modifiedHtml = html.replace(
    /<(h[1-4])([^>]*?)>([\s\S]*?)<\/h[1-4]>/gi,
    (match, tag, attributes, content) => {
      const cleanText = content
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();

      if (!cleanText) return match;

      const baseId = cleanText
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      // Two headings with identical (or similarly-punctuated) text would
      // otherwise reduce to the same slug — and downstream, the same React
      // key in TocSidebar. Suffix repeats so every heading gets a unique,
      // still-readable id.
      const seenCount = seenIds.get(baseId) ?? 0;
      seenIds.set(baseId, seenCount + 1);
      const id = seenCount === 0 ? baseId : `${baseId}-${seenCount + 1}`;

      toc.push({
        text: cleanText,
        id,
        level: tag.toLowerCase() as "h1" | "h2" | "h3" | "h4",
      });

      // Clickable hash anchor for h2/h3 — deep-links to that section
      const anchor =
        tag === "h2" || tag === "h3"
          ? `<a href="#${id}" class="heading-anchor" aria-label="Link to ${cleanText}">#</a>`
          : "";

      return `<${tag}${attributes ? " " + attributes.trim() : ""} id="${id}">${anchor}${content}</${tag}>`;
    }
  );

  return { modifiedHtml, toc };
}

function stripTrailingEmptyBlocks(html: string): string {
  return html.replace(
    /(?:\s*<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>\s*)+$/gi,
    ""
  );
}

function generateAdString(ad: { link: string; image: string; title: string }) {
  return `
    <a href="${ad.link}" target="_blank" rel="noopener noreferrer sponsored"
      class="relative block my-6 w-full h-24 sm:h-28 md:h-32 rounded-xl overflow-hidden border border-border hover:shadow-md transition-shadow bg-card">
      <img src="${ad.image}" alt="${ad.title}" class="absolute inset-0 w-full h-full object-cover" />
    </a>
  `;
}

function parseAdsShortcodes(html: string, ads: any[]): string {
  let updatedHtml = html;
  ads.forEach((ad) => {
    const tokenRegex = `\\[\\s*Ads(?:\\s|&nbsp;)+${ad.position}\\s*\\]`;
    const regex = new RegExp(
      `(<(p|li)[^>]*>)?(<(?:code|span|strong|em)[^>]*>)*\\s*${tokenRegex}\\s*(</(?:code|span|strong|em)>)*(</(p|li)>)?`,
      "gi"
    );
    updatedHtml = updatedHtml.replace(regex, () => generateAdString(ad));
  });
  return updatedHtml;
}

function generateBannerString(banner: { link: string; image: string; title: string }) {
  return `
    <a href="${banner.link}" target="_blank" rel="noopener noreferrer sponsored"
      class="relative block my-10 w-full h-28 sm:h-32 md:h-40 rounded-xl overflow-hidden border border-border hover:shadow-lg transition-shadow bg-card group">
      <img src="${banner.image}" alt="${banner.title}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
      <div class="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white/90 uppercase tracking-widest">Advertisement</div>
    </a>
  `;
}

function parseBannerShortcodes(html: string, banners: any[]): string {
  let updatedHtml = html;
  banners.forEach((banner) => {
    const tokenRegex = `\\[\\s*Banners?(?:\\s|&nbsp;)+${banner.order}\\s*\\]`;
    const regex = new RegExp(
      `(<(p|li)[^>]*>)?(<(?:code|span|strong|em)[^>]*>)*\\s*${tokenRegex}\\s*(</(?:code|span|strong|em)>)*(</(p|li)>)?`,
      "gi"
    );
    updatedHtml = updatedHtml.replace(regex, () => generateBannerString(banner));
  });
  return updatedHtml;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripWrappingParagraph(html: string): string {
  return html
    .trim()
    .replace(/^<p[^>]*>/i, "")
    .replace(/<\/p>\s*$/i, "")
    .trim();
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.content.replace(/<[^>]*>/g, "").substring(0, 160),
    openGraph: post.featuredImage ? { images: [post.featuredImage] } : undefined,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug },
    include: { author: true, tags: true },
  });

  if (!post || !post.published) notFound();

  console.log("POST UPDATED AT:", post.updatedAt, "| CONTENT LENGTH:", post.content.length);

  // NOTE: dumping the full raw content here was flooding the terminal and
  // truncating before reaching the section we actually needed to inspect.
  // Log a small window around "Key Highlights" instead.
  const khIdx = post.content.toLowerCase().indexOf("key highlights");
  if (khIdx !== -1) {
    console.log(
      "CONTEXT AROUND KEY HIGHLIGHTS:",
      post.content.slice(Math.max(0, khIdx - 50), khIdx + 500)
    );
    console.log(
      "OCCURRENCES OF 'key highlights' IN CONTENT:",
      (post.content.toLowerCase().match(/key highlights/g) || []).length
    );
  } else {
    console.log("'key highlights' NOT FOUND IN RAW CONTENT");
  }

  const session = await auth();
  const isBookmarked = session?.user
    ? !!(await prisma.bookmark.findUnique({
        where: { userId_postId: { userId: session.user.id, postId: post.id } },
      }))
    : false;

  const orderedTags = sortTagsByOrder(post.tags, post.tagOrder);

  const relatedPosts = await prisma.post.findMany({
    where: {
      published: true,
      NOT: { id: post.id },
    },
    take: 9,
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });

  let ads: any[] = [];
  let banners: any[] = [];

  try {
    ads = await (prisma as any).ad.findMany({
      where: { active: true },
      orderBy: { position: "asc" },
    });
    banners = await prisma.banner.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
  } catch {
    ads = [];
    banners = [];
  }
  const tagIds = post.tags.map((t) => t.id);

  const relatedByTags = tagIds.length > 0
    ? await prisma.post.findMany({
        where: {
          published: true,
          NOT: { id: post.id },
          tags: { some: { id: { in: tagIds } } },
        },
        include: { author: true, tags: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      })
    : [];

  const readingTime = Math.max(
    1,
    Math.ceil(post.content.replace(/<[^>]*>/g, "").split(/\s+/).length / 200)
  );

  let processedContent = parseAdsShortcodes(post.content, ads);
  processedContent = parseBannerShortcodes(processedContent, banners);
  processedContent = parseKeyHighlightsBlock(processedContent);
  processedContent = parseAlsoReadBlock(processedContent);
  processedContent = parseDropCapLedeBlock(processedContent);
  processedContent = stripTrailingEmptyBlocks(processedContent);

  const { modifiedHtml, toc } = parseContentAndGenerateToc(processedContent);

  console.log("MODIFIED HTML CONTAINS OVERVIEW TEXT:", modifiedHtml.includes("Overview"));
  console.log(
    "MODIFIED HTML CONTAINS LOWERCASE 'Key highlights' (our injected box):",
    modifiedHtml.includes("Key highlights")
  );
  console.log(
    "MODIFIED HTML CONTAINS RAW 'Key Highlights' (untouched heading):",
    modifiedHtml.includes(">Key Highlights<") || modifiedHtml.includes("Key Highlights</strong>")
  );
  console.log("MODIFIED HTML LENGTH:", modifiedHtml.length);

  const wasUpdated =
    post.updatedAt &&
    new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 60_000;

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 scroll-smooth">
      <ViewTracker postId={post.id} />
      <ReadingProgressBar />
      <Navbar />

      {/* Hero Header */}
      <div className="relative w-full h-[420px] md:h-[500px] overflow-hidden">
        <style>{`
          @keyframes heroZoomIn {
            from { transform: scale(1.09); }
            to { transform: scale(1); }
          }
          .hero-zoom {
            animation: heroZoomIn 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
        `}</style>

        <ParallaxHeroImage src={post.featuredImage} alt={post.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

        <FadeIn>
          <div className="absolute top-6 left-0 right-0 max-w-4xl mx-auto px-6 z-20">
            <nav className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-card/80 backdrop-blur-md border border-border rounded-full text-sm text-muted-foreground font-medium shadow-lg transition-shadow duration-300 hover:shadow-xl">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <span className="text-border text-xs">/</span>
              <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              <span className="text-border text-xs">/</span>
              <span className="text-foreground truncate max-w-[250px]">{post.title}</span>
            </nav>
          </div>
        </FadeIn>

        <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-6 pb-10">
          {orderedTags.length > 0 && (
            <FadeIn delay={0.1}>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {orderedTags.map((t) => (
                  <Link
                    key={t.id}
                    href={`/blog?tag=${t.slug}`}
                    className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border border-white/25 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <TagIcon icon={t.icon} className="inline-flex w-3.5 h-3.5 [&>svg]:w-full [&>svg]:h-full" />
                    {t.name}
                  </Link>
                ))}
              </div>
            </FadeIn>
          )}

          <FadeIn delay={0.2}>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-5">{post.title}</h1>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex items-center gap-4 w-full justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-white/60 shadow-xl shrink-0 bg-muted transition-transform duration-300 hover:scale-105">
                  {post.author.image ? (
                    <img src={post.author.image} alt={post.author.name || "Author"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
                      {post.author.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-lg truncate">{post.author.name}</p>
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <time>{formatDate(post.createdAt)}</time>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {readingTime} min read
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <BookmarkButton
                  postId={post.id}
                  initialBookmarked={isBookmarked}
                  className="bg-white/15 hover:bg-white/25 backdrop-blur-md !text-white rounded-full px-3 py-2 border border-white/25"
                />
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-[1560px] mx-auto px-6 -mt-6 relative z-10 pb-8 md:pb-12 flex flex-col 2xl:flex-row justify-center gap-8 items-start">
        {/* TOC Sidebar */}
        {toc.length > 0 && (
          <FadeIn className="hidden 2xl:block w-[340px] shrink-0 sticky top-28 z-20">
            <TocSidebar toc={toc} title={post.title} />
          </FadeIn>
        )}

        {/* Article Content */}
        <FadeIn delay={0.1} className="w-full max-w-4xl">
          <div className="bg-card border border-border rounded-2xl shadow-xl px-8 md:px-10 pt-12 pb-8 transition-shadow duration-300 hover:shadow-2xl">
            <style>{`
              .rich-text-render { color: var(--foreground); }
              .rich-text-render p { color: var(--muted-foreground); line-height: 1.85; margin-bottom: 1.35rem; font-size: 1.0625rem; }
              .rich-text-render p:empty,
              .rich-text-render p:has(> br:only-child) { display: none; }
              .rich-text-render > *:last-child { margin-bottom: 0; }
              
              /* --- Drop cap + bold lede on the article's opening --- */
/* --- Drop cap + bold lede on the article's opening --- */
.rich-text-render .drop-cap {
  float: left;
  font-size: 3.4rem;
  line-height: 0.8;
  font-weight: 700;
  padding: 0.05em 0.08em 0 0;
  color: var(--foreground);
}
.rich-text-render .lede-bold {
  font-weight: 700;
  color: var(--foreground);
}

              /* --- Headings: double-bar accent (h2 only) --- */
              .rich-text-render h1, .rich-text-render h2, .rich-text-render h3, .rich-text-render h4 {
                color: var(--foreground);
                font-weight: 700;
                letter-spacing: -0.01em;
                line-height: 1.3;
                scroll-margin-top: 100px;
                position: relative;
              }

              .rich-text-render h1 {
                font-size: clamp(1.625rem, 1.3rem + 1.2vw, 2.1rem);
                margin-top: 2.5rem;
                margin-bottom: 1rem;
              }

              .rich-text-render h2 {
                font-size: clamp(1.3rem, 1.15rem + 0.6vw, 1.625rem);
                margin-top: 3rem;
                margin-bottom: 1.15rem;
                padding-left: 1.35rem;
              }
              .rich-text-render h2::before {
                content: "";
                position: absolute;
                left: 0;
                top: 0.14em;
                bottom: 0.14em;
                width: 4px;
                border-radius: 2px;
                background: var(--accent);
              }
              .rich-text-render h2::after {
                content: "";
                position: absolute;
                left: 9px;
                top: 0.14em;
                bottom: 0.14em;
                width: 2px;
                border-radius: 1px;
                background: var(--border);
              }

              .rich-text-render h3 {
                font-size: clamp(1.0625rem, 1rem + 0.3vw, 1.2rem);
                font-weight: 600;
                margin-top: 2.25rem;
                margin-bottom: 0.7rem;
              }

              .rich-text-render h4 {
                font-size: 1rem;
                font-weight: 600;
                color: var(--muted-foreground);
                margin-top: 1.75rem;
                margin-bottom: 0.6rem;
              }

              /* Clickable hash anchor */
              .rich-text-render .heading-anchor {
                position: absolute;
                left: -1.5rem;
                top: 0.15em;
                font-size: 0.8em;
                font-weight: 500;
                color: var(--muted-foreground);
                text-decoration: none;
                opacity: 0;
                transition: opacity 0.15s ease, color 0.15s ease;
              }
              .rich-text-render h2:hover .heading-anchor,
              .rich-text-render h3:hover .heading-anchor,
              .rich-text-render .heading-anchor:focus-visible {
                opacity: 0.6;
              }
              .rich-text-render .heading-anchor:hover { opacity: 1 !important; color: var(--accent); }
              @media (max-width: 640px) {
                .rich-text-render .heading-anchor {
                  position: static;
                  margin-right: 0.4rem;
                  opacity: 0.4;
                }
              }

              /* --- Images --- */
              .rich-text-render img {
                max-width: 100%;
                height: auto;
                border-radius: 12px;
                margin: 2rem auto;
                display: block;
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
                transition: transform 0.4s ease;
              }
              .rich-text-render img:hover { transform: scale(1.015); }

              /* --- Lists --- */
              .rich-text-render ul, .rich-text-render ol { padding-left: 1.75rem; margin: 1.35rem 0; }
              .rich-text-render ul { list-style-type: disc; }
              .rich-text-render ol { list-style-type: decimal; }
              .rich-text-render li { margin: 0.45rem 0; line-height: 1.8; }
              .rich-text-render li::marker { color: var(--accent); }

              /* --- Table: "spec sheet" treatment --- */
              .rich-text-render table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                margin: 2.5rem 0;
                border: 1px solid var(--border);
                border-radius: 14px;
                overflow: hidden;
                font-size: 0.9375rem;
                box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
              }

              .rich-text-render thead th {
                background: linear-gradient(
                  180deg,
                  color-mix(in srgb, var(--accent) 8%, transparent),
                  color-mix(in srgb, var(--accent-2) 4%, transparent)
                );
                font-weight: 700;
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--foreground);
                padding: 0.9rem 1.15rem;
                border-bottom: 2px solid var(--border);
                text-align: left;
              }
              .rich-text-render thead th:first-child { border-top-left-radius: 13px; }
              .rich-text-render thead th:last-child { border-top-right-radius: 13px; }

              .rich-text-render td {
                padding: 0.85rem 1.15rem;
                border-bottom: 1px solid var(--border);
                font-variant-numeric: tabular-nums;
                color: var(--muted-foreground);
              }
              .rich-text-render td:first-child {
                font-weight: 600;
                color: var(--foreground);
              }
              .rich-text-render tbody tr:last-child td { border-bottom: none; }
              .rich-text-render tbody tr:last-child td:first-child { border-bottom-left-radius: 13px; }
              .rich-text-render tbody tr:last-child td:last-child { border-bottom-right-radius: 13px; }

              .rich-text-render tbody tr {
                transition: background-color 0.15s ease;
              }
              .rich-text-render tbody tr:hover td {
                background: color-mix(in srgb, var(--accent) 5%, transparent);
              }
            `}</style>

            <ArticleImageLightbox>
              <div className="overflow-x-auto rounded-xl">
                <div
                  className="rich-text-render prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: modifiedHtml }}
                  suppressHydrationWarning
                />
              </div>
            </ArticleImageLightbox>
            <AlsoReadMount />
            <KeyHighlightsMount />

            {/* Author Bio */}
            <div className="mt-10 pt-6 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-4 justify-between bg-muted/40 border border-border/60 rounded-2xl px-5 py-4 sm:px-6 sm:py-5">
                <Link href="/blog" className="group inline-flex items-center gap-2 text-accent hover:underline font-medium text-sm transition-colors shrink-0">
                  <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                  All posts
                </Link>

                <div className="hidden sm:block h-8 w-px bg-border" />

                <BookmarkButton
                  postId={post.id}
                  initialBookmarked={isBookmarked}
                  showLabel
                  className="px-3 py-1.5 rounded-full border border-border hover:border-[#6f42c1] dark:hover:border-white shrink-0"
                />

                <div className="hidden sm:block h-8 w-px bg-border" />

                <div className="flex items-center gap-3.5 w-full sm:w-auto justify-center sm:justify-end">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-muted ring-2 ring-border shrink-0 transition-transform duration-300 hover:scale-105">
                    {post.author.image ? (
                      <img
                        src={post.author.image}
                        alt={post.author.name || "Author"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg">
                        {post.author.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                  </div>

                  <div className="text-left sm:text-right leading-tight">
                    <p className="text-xs text-muted-foreground">Written by</p>
                    <p className="text-sm font-semibold text-foreground">{post.author.name}</p>
                    {wasUpdated && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Last updated {formatDate(post.updatedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Social Sidebar */}
        <FadeIn delay={0.2} className="hidden 2xl:block w-[340px] shrink-0 sticky top-28 z-20">
          <SocialSidebar />
        </FadeIn>
      </main>

      {/* POLL */}
      <FadeIn>
        <div className="max-w-4xl mx-auto px-6 mt-6 mb-6 md:mt-8 md:mb-8">
          <Poll />
        </div>
      </FadeIn>

      {/* RATING */}
      <FadeIn>
        <div className="max-w-4xl mx-auto px-6 mb-6 md:mb-8">
          <RatingMeter postId={post.id} />
        </div>
      </FadeIn>

      {/* COMMENTS */}
      <FadeIn>
        <div className="max-w-4xl mx-auto px-6 mb-6 md:mb-8">
          <CommentSection postId={post.id} />
        </div>
      </FadeIn>

      {/* Keep Reading */}
      <FadeIn>
        <KeepReading relatedPosts={relatedPosts} />
      </FadeIn>

      {/* Related Articles (tag-based) */}
      <FadeIn>
        <RelatedArticles posts={relatedByTags} />
      </FadeIn>

      <Footer />
      <MobileNav toc={toc} />
      <BackToTop />
    </div>
  );
}