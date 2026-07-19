import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TocSidebar from "@/components/blog/TocSidebar";
import SocialSidebar from "@/components/layout/SocialSidebar";
import type { Metadata } from "next";
import MobileNav from "@/components/layout/MobileNav";
import BackToTop from "@/components/ui/BackToTop";
import Poll from "@/components/polls/Poll";
import RatingMeter from "@/components/blog/RatingMeter";
import KeepReading from "@/components/feeds/KeepReading";
import CommentSection from "@/components/blog/CommentSection";
import RelatedArticles from "@/components/feeds/RelatedArticles";
import TagIcon from "@/components/blog/TagIcon";
import { sortTagsByOrder } from "@/lib/sortTags";
import ViewTracker from "@/components/blog/ViewTracker";
import { FadeIn } from "@/components/ui/AnimatedSection";
import { ArrowLeft, Clock } from "lucide-react";
import ReadingProgressBar from "@/components/ui/ReadingProgressBar";
import ParallaxHeroImage from "@/components/ui/ParallaxHeroImage";
import ArticleImageLightbox from "@/components/blog/ArticleImageLightbox";
import { auth } from "@/auth";
import BookmarkButton from "@/components/bookmarks/BookmarkButton";
import { parseKeyHighlightsBlock } from "@/components/feeds/KeyHighlights";
import { parseAlsoReadBlock } from "@/components/feeds/AlsoRead";
import AlsoReadMount from "@/components/feeds/AlsoReadMount";
import KeyHighlightsMount from "@/components/feeds/KeyHighlightsMount";
import { parseDropCapLedeBlock } from "@/components/blog/DropCapLede";
import TableProcessor from "@/components/blog/TableProcessor";
import { parseSpecificationsBlock } from "@/components/feeds/Specifications";
import { parseGalleryBlock } from "@/components/feeds/Gallery";
import GalleryMount from "@/components/feeds/GalleryMount";
import SpecificationsMount from "@/components/feeds/SpecificationsMount";

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

      const seenCount = seenIds.get(baseId) ?? 0;
      seenIds.set(baseId, seenCount + 1);
      const id = seenCount === 0 ? baseId : `${baseId}-${seenCount + 1}`;

      toc.push({
        text: cleanText,
        id,
        level: tag.toLowerCase() as "h1" | "h2" | "h3" | "h4",
      });

      return `<${tag}${attributes ? " " + attributes.trim() : ""} id="${id}">${content}</${tag}>`;
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
      class="relative block my-6 w-full h-24 sm:h-28 md:h-32 overflow-hidden border-[1.5px] border-border-heavy bg-card">
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

function stripEmptyParagraphs(html: string): string {
  return html.replace(
    /<p[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi,
    ""
  );
}

function generateBannerString(banner: { link: string; image: string; title: string }) {
  return `
    <a href="${banner.link}" target="_blank" rel="noopener noreferrer sponsored"
      class="relative block my-10 w-full h-28 sm:h-32 md:h-40 overflow-hidden border-[1.5px] border-border-heavy bg-card group">
      <img src="${banner.image}" alt="${banner.title}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
      <div class="absolute top-2 right-2 bg-accent-2 text-on-accent-2 border-[1.5px] border-border-heavy px-2 py-1 text-[10px] font-bold uppercase tracking-widest">Advertisement</div>
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

function wrapTables(html: string): string {
  return html.replace(
    /<table([^>]*)>([\s\S]*?)<\/table>/gi,
    (_match, attrs, inner) => {
      const encoded = btoa(inner);
      return `<!--TABLE_PLACEHOLDER_${encoded}-->`;
    }
  );
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug },
    include: { author: true, tags: true },
  });

  if (!post || !post.published) notFound();

  console.log("POST UPDATED AT:", post.updatedAt, "| CONTENT LENGTH:", post.content.length);

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
  processedContent = stripEmptyParagraphs(processedContent);
  processedContent = parseBannerShortcodes(processedContent, banners);
  processedContent = parseKeyHighlightsBlock(processedContent);
  processedContent = parseAlsoReadBlock(processedContent);
  processedContent = parseDropCapLedeBlock(processedContent);
  processedContent = wrapTables(processedContent);
  processedContent = parseSpecificationsBlock(processedContent);
  processedContent = parseGalleryBlock(processedContent);
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
      <div className="relative w-full h-[420px] md:h-[500px] overflow-hidden border-b-[1.5px] border-border-heavy">
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
            <nav className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-card border-[1.5px] border-border-heavy text-sm text-muted-foreground font-medium">
              <Link href="/" className="hover:text-accent transition-colors">Home</Link>
              <span className="text-border text-xs">/</span>
              <Link href="/blog" className="hover:text-accent transition-colors">Blog</Link>
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
                    className="inline-flex items-center gap-1.5 bg-accent-3 text-on-accent-3 text-xs font-bold uppercase tracking-widest px-3 py-1 border-[1.5px] border-border-heavy transition-transform duration-150 hover:-translate-y-0.5"
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
                <div className="w-14 h-14 overflow-hidden border-[1.5px] border-white shrink-0 bg-card">
                  {post.author.image ? (
                    <img src={post.author.image} alt={post.author.name || "Author"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-accent flex items-center justify-center text-on-accent font-bold text-2xl">
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
                {/* Hero position */}
<BookmarkButton
  postId={post.id}
  initialBookmarked={isBookmarked}
  className="bg-card px-3 py-2 border-[1.5px] shrink-0"
/>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-[1560px] mx-auto px-6 mt-8 relative z-10 pb-8 md:pb-12 flex flex-col 2xl:flex-row justify-center gap-8 items-start">
        {/* TOC Sidebar */}
        {toc.length > 0 && (
          <FadeIn className="hidden 2xl:block w-[340px] shrink-0 sticky top-28 z-20">
            <TocSidebar toc={toc} title={post.title} />
          </FadeIn>
        )}

        {/* Article Content */}
        <FadeIn delay={0.1} className="w-full max-w-4xl">
          <div className="bg-card border-[1.5px] border-border-heavy px-8 md:px-10 pt-12 pb-8">
            <style>{`
            .rich-text-render { color: var(--foreground); }
.rich-text-render p { color: var(--muted-foreground); line-height: 1.85; margin-bottom: 1.15rem; font-size: 1.0625rem; }
.rich-text-render p:empty,
.rich-text-render p:has(> br:only-child) { display: none; }
.rich-text-render > *:last-child { margin-bottom: 0; }

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

.rich-text-render h1,
.rich-text-render h2,
.rich-text-render h3,
.rich-text-render h4 {
  scroll-margin-top: 100px;
}

.rich-text-render h1 {
  font-size: clamp(2rem, 1.5rem + 2vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-top: 2.5rem;
  margin-bottom: 1.5rem;
  color: var(--foreground);
}

.rich-text-render h2 {
  font-size: clamp(1.3rem, 1.15rem + 0.6vw, 1.625rem);
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.35;
  margin-top: 2.25rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.6rem;
  border-bottom: 3px solid var(--border-heavy);
  color: var(--foreground);
  display: inline-block;
}
.rich-text-render h2:first-child {
  margin-top: 0;
}

.rich-text-render h3 {
  font-size: clamp(1.1rem, 1rem + 0.4vw, 1.3rem);
  font-weight: 600;
  margin-top: 1.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  color: var(--foreground);
  border-bottom: 1.5px solid var(--border);
}

.rich-text-render h4 {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted-foreground);
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  padding: 0.35rem 0.85rem;
  border: 1.5px solid var(--border-heavy);
}

.rich-text-render img {
  max-width: 100%;
  height: auto;
  margin: 2rem auto;
  display: block;
  border: 1.5px solid var(--border-heavy);
}

.rich-text-render ul, .rich-text-render ol { padding-left: 1.75rem; margin: 1.35rem 0; }
.rich-text-render ul { list-style-type: disc; }
.rich-text-render ol { list-style-type: decimal; }
.rich-text-render li { margin: 0.45rem 0; line-height: 1.8; }
.rich-text-render li::marker { color: var(--accent); }

.rich-text-render .table-wrap {
  margin: 2.75rem 0;
  overflow: hidden;
  border: 1.5px solid var(--border-heavy);
}

.rich-text-render .table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}
.rich-text-render .table-scroll::-webkit-scrollbar { height: 6px; }
.rich-text-render .table-scroll::-webkit-scrollbar-thumb {
  background: var(--border-heavy);
}

.rich-text-render table {
  width: 100%;
  min-width: 480px;
  border-collapse: collapse;
  margin: 0;
  font-size: 0.9rem;
}

.rich-text-render thead th {
  background: var(--accent);
  color: var(--on-accent);
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 1rem 1.25rem;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1.5px solid var(--border-heavy);
}
.rich-text-render thead th + th {
  border-left: 1.5px solid var(--border-heavy);
}

.rich-text-render td {
  padding: 0.95rem 1.25rem;
  border-bottom: 1px solid var(--border);
  color: var(--foreground);
  font-variant-numeric: tabular-nums;
  vertical-align: top;
}
.rich-text-render td + td {
  border-left: 1px solid var(--border);
}
.rich-text-render tbody tr:last-child td { border-bottom: none; }

.rich-text-render td:first-child {
  font-weight: 700;
  color: var(--foreground);
}

.rich-text-render tbody tr {
  transition: background 0.15s ease;
}
.rich-text-render tbody tr:hover td {
  background: var(--accent-tint);
}
            `}</style>

            <ArticleImageLightbox>
  <div className="rich-text-render">
    <TableProcessor html={modifiedHtml} />
  </div>
</ArticleImageLightbox>
            <AlsoReadMount />
            <KeyHighlightsMount />
            <SpecificationsMount />
            <GalleryMount />

            {/* Author Bio */}
            <div className="mt-10 pt-6 border-t-[1.5px] border-border-heavy">
              <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-4 justify-between bg-background border-[1.5px] border-border-heavy px-5 py-4 sm:px-6 sm:py-5">
                <Link href="/blog" className="group inline-flex items-center gap-2 text-accent hover:underline font-bold text-sm transition-colors shrink-0">
                  <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                  All posts
                </Link>

                <div className="hidden sm:block h-8 w-px bg-border" />

                {/* Author-bio position */}
<BookmarkButton
  postId={post.id}
  initialBookmarked={isBookmarked}
  showLabel
  className="px-3 py-1.5 border-[1.5px] shrink-0"
/>

                <div className="hidden sm:block h-8 w-px bg-border" />

                <div className="flex items-center gap-3.5 w-full sm:w-auto justify-center sm:justify-end">
                  <div className="w-11 h-11 overflow-hidden bg-card border-[1.5px] border-border-heavy shrink-0">
                    {post.author.image ? (
                      <img
                        src={post.author.image}
                        alt={post.author.name || "Author"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-accent flex items-center justify-center text-on-accent font-bold text-lg">
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