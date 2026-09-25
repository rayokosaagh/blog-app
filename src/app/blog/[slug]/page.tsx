import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TocSidebar from "@/components/blog/TocSidebar";
import SocialSidebar from "@/components/layout/SocialSidebar";
import SpotlightAdRail from "@/components/ads/SpotlightAdRail";
import { getSpotlightAdsHeader, getSpotlightAdsTitle } from "@/lib/settings";
import type { Metadata } from "next";
import MobileNav from "@/components/layout/MobileNav";
import BackToTop from "@/components/ui/BackToTop";
import Poll from "@/components/polls/Poll";
import RatingMeter from "@/components/blog/RatingMeter";
import ContinueReading from "@/components/feeds/ContinueReading";
import CommentSection from "@/components/blog/CommentSection";
import RelatedArticles from "@/components/feeds/RelatedArticles";
import TagIcon from "@/components/blog/TagIcon";
import CategoryBadge from "@/components/blog/CategoryBadge";
import { getPostCategory } from "@/lib/blog/categories";
import { sortTagsByOrder } from "@/lib/sortTags";
import { getExcerpt, getReadingTime } from "@/lib/postUtils";
import { APP_URL } from "@/lib/appUrl";
import JsonLd from "@/components/seo/JsonLd";
import ViewTracker from "@/components/blog/ViewTracker";
import { FadeIn } from "@/components/ui/AnimatedSection";
import { ArrowLeft, Clock } from "lucide-react";
import ReadingProgressBar from "@/components/ui/ReadingProgressBar";
import ParallaxHeroImage from "@/components/ui/ParallaxHeroImage";
import ArticleImageLightbox from "@/components/blog/ArticleImageLightbox";
import { auth } from "@/auth";
import BookmarkButton from "@/components/bookmarks/BookmarkButton";
import AuthorCard from "@/components/blog/AuthorCard";
import ShareButtons from "@/components/blog/ShareButtons";
import VerdictCard from "@/components/blog/VerdictCard";
import ArticleEndCarousel, { type ArticleEndSlide } from "@/components/blog/ArticleEndCarousel";
import SpecLinkCard from "@/components/blog/SpecLinkCard";
import TrendingPostsCard from "@/components/blog/TrendingPostsCard";
import ReadingHistoryTracker from "@/components/blog/ReadingHistoryTracker";
import { readVerdict, VERDICT_MAX } from "@/lib/verdict";
import { parseKeyHighlightsBlock } from "@/components/feeds/KeyHighlights";
import { parseProsConsBlock } from "@/components/feeds/ProsCons";
import { parseAlsoReadBlock } from "@/components/feeds/AlsoRead";
import AlsoReadMount from "@/components/feeds/AlsoReadMount";
import KeyHighlightsMount from "@/components/feeds/KeyHighlightsMount";
import ProsConsMount from "@/components/feeds/ProsConsMount";
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
  /** The number the article prints on this heading ("01", "1.2"), if any. */
  number?: string;
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
  // Mirrors the article's CSS counters (see the style block below): a
  // Section heading (h1, shipped as h2[data-was-h1]) is "01" and resets the
  // sub-count; an h3 is "section.sub". Plain h2/h4 are unnumbered. Counted
  // here so the ToC shows the same numbers the reader sees on the headings.
  let section = 0;
  let subsection = 0;

  const modifiedHtml = html.replace(
    /<(h[1-4])([^>]*?)>([\s\S]*?)<\/h[1-4]>/gi,
    (match, tag, attributes, content) => {
      const rawText = content
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();
      // Plain text for the ToC, which React renders as text — so entities have
      // to be decoded here or "Camera &amp; Software" shows the "&amp;".
      const cleanText = rawText
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&amp;/g, "&")
        .trim();

      // An empty h3 is left out of the ToC but still bumps the CSS counter,
      // so it has to bump ours too or every later number would be off by one.
      if (!cleanText) {
        if (tag.toLowerCase() === "h3") subsection++;
        return match;
      }

      // The page title is the h1. Older posts were written with the editor's
      // H1 button, so their body headings shipped as competing h1s — demote
      // them here rather than migrating the stored content. Safe at this point
      // in the pipeline: every block parser that matches on h1-h4 has already
      // run and consumed its own headings (see the call site).
      const level = (tag.toLowerCase() === "h1" ? "h2" : tag.toLowerCase()) as TocItem["level"];

      // From the undecoded text, so ids (and shared #links) stay exactly as
      // they were before the ToC started decoding entities.
      const baseId = rawText
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const seenCount = seenIds.get(baseId) ?? 0;
      seenIds.set(baseId, seenCount + 1);
      const id = seenCount === 0 ? baseId : `${baseId}-${seenCount + 1}`;

      // data-was-h1 carries the original size through the demotion, so the
      // outline is fixed without every published post's headings shrinking.
      const demoted = level !== tag.toLowerCase() ? " data-was-h1" : "";

      let number: string | undefined;
      if (demoted) {
        section++;
        subsection = 0;
        number = String(section).padStart(2, "0");
      } else if (level === "h3") {
        subsection++;
        number = `${section}.${subsection}`;
      }

      toc.push({ text: cleanText, id, level, number });

      return `<${level}${attributes ? " " + attributes.trim() : ""} id="${id}"${demoted}>${content}</${level}>`;
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
      class="inline-ad relative block my-6 w-full h-24 sm:h-28 md:h-32 overflow-hidden surface-border bg-card shadow-brutal-sm">
      <img loading="lazy" decoding="async" src="${ad.image}" alt="${ad.title}" class="absolute inset-0 w-full h-full object-cover" />
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
      class="inline-ad relative block my-10 w-full h-28 sm:h-32 md:h-40 overflow-hidden surface-border bg-card shadow-brutal-sm group">
      <img loading="lazy" decoding="async" src="${banner.image}" alt="${banner.title}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
      <div class="absolute top-2 right-2 bg-accent-2 text-on-accent-2 surface-pill px-2 py-1 text-[10px] font-bold uppercase tracking-widest">Advertisement</div>
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

/**
 * Marks images inside the article body lazy.
 *
 * These come from the editor as raw HTML, so they never pass through a React
 * component where the attribute could be set — a long review can easily carry
 * 20+ full-width photos that all download eagerly on first paint. Tags that
 * already declare `loading` (the injected ad and banner markup) are left alone.
 */
function lazyLoadContentImages(html: string): string {
  return html.replace(/<img(?=[\s\n])((?:[^>])*?)(\/?)>/g, (match, attrs, slash) =>
    /\bloading=/.test(attrs)
      ? match
      : `<img loading="lazy" decoding="async"${attrs}${slash}>`
  );
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

/**
 * The thing a scored review is about, recovered from its headline.
 *
 * Posts aren't linked to a Product row, so the name has to come from the
 * title: "Xiaomi Redmi Note 17 Pro+ review: the midrange phone to beat" →
 * "Xiaomi Redmi Note 17 Pro+". Structured data needs an `itemReviewed.name`
 * and the verdict card needs a label for the overall bar; both would look
 * absurd with the full headline. Falls back to the title when nothing matches,
 * which is correct-if-verbose rather than wrong.
 */
function reviewedItemName(title: string): string {
  const cut = title.split(/\s*[:—–|]\s*/)[0];
  return cut.replace(/\s+review\b.*$/i, "").trim() || title;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug },
    include: { author: { select: { name: true } } },
  });
  if (!post) return { title: "Post not found" };

  // getExcerpt turns tags into spaces before collapsing whitespace. The old
  // inline `replace(/<[^>]*>/g, "")` deleted them outright, which fused the
  // last word of each block onto the next — the description for this very post
  // used to read "Review OverviewThe Xiaomi 17T is…".
  const description = getExcerpt(post.content, 32).slice(0, 160);
  const url = `/blog/${post.slug}`;

  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description,
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: post.author?.name ? [post.author.name] : undefined,
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
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
    include: {
      // Public fields only: the full row would also load the author's email
      // and password hash into this render for no reason.
      author: { select: { id: true, name: true, image: true, bio: true, socials: true } },
      tags: true,
    },
  });

  if (!post || !post.published) notFound();

  const authorArticleCount = await prisma.post.count({
    where: { authorId: post.authorId, published: true },
  });

  const session = await auth();
  const isBookmarked = session?.user
    ? !!(await prisma.bookmark.findUnique({
        where: { userId_postId: { userId: session.user.id, postId: post.id } },
      }))
    : false;

  const orderedTags = sortTagsByOrder(post.tags, post.tagOrder);
  const verdict = readVerdict(post);
  const category = getPostCategory(post.category);


  let ads: any[] = [];
  let banners: any[] = [];
  let spotlightAds: any[] = [];

  try {
    ads = await (prisma as any).ad.findMany({
      where: { active: true },
      orderBy: { position: "asc" },
    });
    banners = await prisma.banner.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
    spotlightAds = await (prisma as any).spotlightAd.findMany({
      where: { active: true },
      orderBy: { position: "asc" },
      select: { id: true, title: true, mediaUrl: true, mediaType: true, link: true },
    });
  } catch {
    ads = [];
    banners = [];
    spotlightAds = [];
  }

  const [spotlightHeader, spotlightTitle] = await Promise.all([
    getSpotlightAdsHeader(),
    getSpotlightAdsTitle(),
  ]);
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

  // End-of-article cards. The linked product only counts once it is
  // published — its page would 404 otherwise. Trending is by views, the one
  // engagement signal with real spread; the current post is left out.
  const [linkedProduct, trendingPosts] = await Promise.all([
    post.productId
      ? prisma.product.findFirst({
          where: { id: post.productId, published: true },
          select: { slug: true, name: true, brand: true, image: true, category: { select: { name: true } } },
        })
      : null,
    prisma.post.findMany({
      where: { published: true, NOT: { id: post.id } },
      orderBy: { views: "desc" },
      take: 5,
      select: { id: true, slug: true, title: true, featuredImage: true, views: true },
    }),
  ]);

  // Swipe order on small screens: verdict, trending, specs. Wide screens
  // place them by column instead — specs left, verdict centre, trending right
  // — and never put a side card in the centre, even when there is no verdict.
  const endSlides: ArticleEndSlide[] = [
    ...(verdict
      ? [{
          key: "verdict",
          label: "Verdict",
          place: "center" as const,
          // The card brings its own vertical margin for the stand-alone
          // layout; here the section supplies the spacing.
          node: (
            <div className="[&>section]:my-0">
              <VerdictCard verdict={verdict} productName={reviewedItemName(post.title)} />
            </div>
          ),
        }]
      : []),
    ...(trendingPosts.length > 0
      ? [{ key: "trending", label: "Trending", place: "right" as const, node: <TrendingPostsCard posts={trendingPosts} /> }]
      : []),
    ...(linkedProduct
      ? [{ key: "specs", label: "Specs", place: "left" as const, node: <SpecLinkCard product={linkedProduct} /> }]
      : []),
  ];

  const readingTime = Math.max(
    1,
    Math.ceil(post.content.replace(/<[^>]*>/g, "").split(/\s+/).length / 200)
  );

  let processedContent = parseAdsShortcodes(post.content, ads);
  processedContent = stripEmptyParagraphs(processedContent);
  processedContent = parseBannerShortcodes(processedContent, banners);
  processedContent = parseKeyHighlightsBlock(processedContent);
  processedContent = parseProsConsBlock(processedContent);
  processedContent = parseAlsoReadBlock(processedContent);
  processedContent = parseDropCapLedeBlock(processedContent);
  processedContent = wrapTables(processedContent);
  processedContent = parseSpecificationsBlock(processedContent);
  processedContent = parseGalleryBlock(processedContent);
  processedContent = stripTrailingEmptyBlocks(processedContent);
  // Last, so it also catches images produced by the block parsers above.
  processedContent = lazyLoadContentImages(processedContent);

  const { modifiedHtml, toc } = parseContentAndGenerateToc(processedContent);

  const wasUpdated =
    post.updatedAt &&
    new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 60_000;

  // Article structured data — what turns a plain blue link into a result card
  // with headline, author, date and image. Absolute URLs are required here;
  // unlike the Metadata API, JSON-LD is not resolved against metadataBase.
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: getExcerpt(post.content, 32).slice(0, 160),
    url: `${APP_URL}/blog/${post.slug}`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${APP_URL}/blog/${post.slug}` },
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.author?.name ?? "Unknown" },
    ...(post.featuredImage && {
      image: post.featuredImage.startsWith("http")
        ? post.featuredImage
        : `${APP_URL}${post.featuredImage}`,
    }),
    keywords: post.tags.map((t) => t.name).join(", "),
    articleSection: category.label,
    wordCount: getExcerpt(post.content, Number.MAX_SAFE_INTEGER).split(" ").length,
    timeRequired: `PT${getReadingTime(post.content)}M`,
  };

  // A second block rather than a `review` property on the BlogPosting: the
  // Review rich result is only eligible when Review is the top-level type with
  // its own itemReviewed. Emitted only for scored posts — a Review without a
  // reviewRating is invalid and would invalidate the whole block.
  const reviewJsonLd = verdict && {
    "@context": "https://schema.org",
    "@type": "Review",
    name: post.title,
    url: `${APP_URL}/blog/${post.slug}`,
    datePublished: post.createdAt.toISOString(),
    author: { "@type": "Person", name: post.author?.name ?? "Unknown" },
    publisher: { "@type": "Organization", name: "Blog" },
    itemReviewed: { "@type": "Product", name: reviewedItemName(post.title) },
    reviewRating: {
      "@type": "Rating",
      ratingValue: verdict.score,
      bestRating: VERDICT_MAX,
      worstRating: 0,
    },
    reviewBody: verdict.summary,
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 scroll-smooth">
      <JsonLd data={articleJsonLd} />
      {reviewJsonLd && <JsonLd data={reviewJsonLd} />}
      <ViewTracker postId={post.id} />
      {/* The private, per-device counterpart to ViewTracker — feeds the
          "Continue reading" rail on the homepage. */}
      <ReadingHistoryTracker
        slug={post.slug}
        title={post.title}
        image={post.featuredImage}
        tag={orderedTags[0]?.name ?? null}
      />
      <ReadingProgressBar />
      <Navbar />

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
              {/* The category, not "Blog": it's the section this article
                  belongs to, and its landing page is the useful place to go
                  back to. /blog is still one hop away in the navbar. */}
              <Link href={`/${category.slug}`} className="hover:text-accent transition-colors">
                {category.label}
              </Link>
              <span className="text-border text-xs">/</span>
              <span className="text-foreground truncate max-w-[250px]">{post.title}</span>
            </nav>
          </div>
        </FadeIn>

        <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-6 pb-10">
          {/* Category kicker first, then tags: "Review · Mobile · Xiaomi" reads
              as kind → subject, which is the order a reader parses it in. */}
          <FadeIn delay={0.1}>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <CategoryBadge category={post.category} />
              {orderedTags.length > 0 && (
                <span aria-hidden className="h-4 w-px bg-white/40 mx-0.5" />
              )}
              {orderedTags.map((t) => (
                  <Link
                    key={t.id}
                    href={`/blog?tag=${t.slug}`}
                    className="inline-flex items-center gap-1.5 bg-accent-3 text-on-accent-3 text-xs font-bold uppercase tracking-widest px-3 py-1 border-[1.5px] border-border-heavy transition-transform duration-150 hover:-translate-y-0.5"
                  >
                    <TagIcon icon={t.icon} colorMode={t.colorMode} color={t.color} className="inline-flex w-3.5 h-3.5 [&>svg]:w-full [&>svg]:h-full" />
                    {t.name}
                  </Link>
                ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h1 className="h-display text-white mb-5">{post.title}</h1>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex items-center gap-4 w-full justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 overflow-hidden border-[1.5px] border-white shrink-0 bg-card">
                  {post.author.image ? (
                    <img loading="lazy" decoding="async" src={post.author.image} alt={post.author.name || "Author"} className="w-full h-full object-cover" />
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

              <div className="shrink-0 flex items-center gap-2">
                {/* Hero position — sits on the photo overlay, so it takes the
                    fixed on-photo colours rather than the theme's foreground
                    token, which is near-black in light mode. */}
                <ShareButtons
                  title={post.title}
                  tone="onPhoto"
                  omit={["Telegram"]}
                  className="hidden sm:inline-flex"
                />
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

      {/* The rails live in the gutters BESIDE the centred article, not in flow
          with it.

          Every other block on this page is a viewport-centred container — 896
          for the article, rating and comments, 1024 for Keep Reading, 1152 for
          Related. So the article's left edge must stay at (viewport - 896) / 2
          at every width, or the page visibly steps sideways as you scroll.

          As flex children the rails could not do that: `justify-center` centres
          rail+article as a group, pushing the article right by (340 + 32) / 2 =
          186px while its siblings stayed put. Absolute positioning takes the
          rails out of flow entirely, so the article centres as if they were not
          there and the ToC is free to appear far earlier than a flex layout
          could afford.

          `.article-rail` sizes each rail to whatever gutter actually exists,
          capped at the designed 340px — see the style block below. */}
      <main className="relative w-full max-w-[1720px] mx-auto px-6 mt-8 z-10 pb-8 md:pb-12">
        <style>{`
          /* 944px = 48px of container padding + the 896px article column.
             Half of what's left is one gutter; reserve 32px of it as the gap.
             Yields 216px at 1440, 291px at 1600, and the full 340px from 1696
             up, where it stops growing. */
          .article-rail {
            width: min(340px, calc((min(100vw, 1720px) - 944px) / 2 - 32px));
          }
        `}</style>

        {/* TOC Sidebar — from 1440, the first width with room for a usable rail */}
        {toc.length > 0 && (
          <div className="article-rail absolute inset-y-0 left-6 hidden min-[1440px]:block z-20">
            <FadeIn className="sticky top-[5.25rem]">
              <TocSidebar toc={toc} title={post.title} />
            </FadeIn>
          </div>
        )}

        {/* Article Content.
            mx-auto is load-bearing: it is what puts this column at
            (viewport - 896) / 2, matching the hero, rating and comments. It
            used to be absent, and `main` was a flex-col whose `items-start`
            pinned the article hard-left at x=24 with the whole right half of
            the page empty — that was the "dead right gutter", not a missing
            sidebar. With the rails now absolute, nothing competes with it. */}
        <FadeIn delay={0.1} className="w-full max-w-4xl mx-auto">
          <div className="bg-card border-[1.5px] border-border-heavy px-8 md:px-10 pt-12 pb-8">
            <style>{`
            .rich-text-render { color: var(--foreground); }
/* Every --a-* variable below is Dashboard -> UI settings -> Article
   typography (src/lib/articleType.ts). They are only emitted when an admin
   changes a value, and each fallback is the value this rule had before, so
   an untouched setting renders exactly as it always has. */
.rich-text-render p { color: var(--muted-foreground); line-height: var(--a-body-leading, 1.85); margin-bottom: 1.15rem; font-size: var(--a-body-size, 1.0625rem); }
.rich-text-render p:empty,
.rich-text-render p:has(> br:only-child) { display: none; }
.rich-text-render > *:last-child { margin-bottom: 0; }

/* Lede: the opening paragraph carries a soft accent rule on the left, and
   its first letter sits in a tinted square — the initial reads as a mark,
   not a giant glyph. Both are theme tokens (square/rounded, site accent). */
.rich-text-render p.lede {
  padding-left: 1.25rem;
  border-left: 3px solid color-mix(in oklab, var(--accent) 40%, var(--border));
}
.rich-text-render .drop-cap {
  float: left;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.25rem;
  height: 4.25rem;
  margin: 0.2rem 1rem 0.35rem 0;
  border-radius: calc(var(--radius) * 0.75);
  background: var(--accent-tint);
  color: var(--accent);
  font-size: 2.75rem;
  font-weight: 800;
  line-height: 1;
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
  color: var(--foreground);
}

/* Article headings — numbered, magazine-style.

     [01] ─────────────────────────────      <- kicker row: bordered chip with
     Design & build                              the section number + a rule
                                                to the right edge
     1.2  Materials                          <- sub-section: small outlined
                                                sub-number, quieter title
     SPECS                                   <- label: quiet small-caps

   Numbers come from CSS counters (h2 = section, h3 = sub-section), so an
   editor writes plain headings and the article numbers itself; add or move
   a section and everything renumbers. Headings authored with the old H1
   button (data-was-h1) are the article's own title repeated and stay
   unnumbered.

   Type (size / weight / tracking / face) comes from the heading-role tokens
   the admin sets in Dashboard → UI settings → Heading typography: h2 = the
   "Page title" role, h3 = "Section heading", h4 = "Eyebrow / label". Colours
   and radii are theme tokens, so the chip is square in brutalist and
   softly rounded in modern, and follows the site accent. */
.rich-text-render {
  counter-reset: section;
}

.rich-text-render h1 {
  font-size: var(--h-display-size);
  font-weight: var(--h-display-weight);
  letter-spacing: var(--h-display-tracking);
  text-transform: var(--h-display-case);
  line-height: 1.1;
  margin-top: 2.5rem;
  margin-bottom: 1.5rem;
}

/* H2 (editor "Title"): the big display heading that follows a kicker.
   Not numbered — it names the section the kicker above it opened. */
.rich-text-render h2 {
  display: block;
  /* Page-title role, not display: at display size the section titles out-shouted the article title itself. */
  font-size: var(--a-title-size, calc(var(--h-page-title-size) * 1.05));
  font-weight: var(--a-title-weight, var(--h-page-title-weight));
  letter-spacing: var(--a-title-tracking, var(--h-page-title-tracking));
  text-transform: var(--a-title-case, var(--h-page-title-case));
  line-height: 1.15;
  color: var(--foreground);
  margin-top: 1.25rem;
  margin-bottom: 1.5rem;
}
.rich-text-render h2:first-child {
  margin-top: 0;
}

/* H1 (editor "Section"): the numbered kicker row — "[01] OVERVIEW ────".
   Authored as h1, shipped as h2[data-was-h1] so the post title stays the
   page's only <h1>; the attribute is what selects this treatment. Short
   label type (eyebrow role, a touch larger, in the accent), a bordered
   number chip before it and a hairline rule filling to the right. */
.rich-text-render h2[data-was-h1] {
  counter-increment: section;
  counter-reset: subsection;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: var(--a-kicker-size, calc(var(--h-eyebrow-size) * 1.15));
  font-weight: var(--a-kicker-weight, var(--h-eyebrow-weight));
  letter-spacing: var(--a-kicker-tracking, 0.18em);
  text-transform: var(--a-kicker-case, uppercase);
  line-height: 1.2;
  color: var(--accent);
  margin-top: 3rem;
  margin-bottom: 1.25rem;
}
.rich-text-render h2[data-was-h1]::before {
  content: counter(section, decimal-leading-zero);
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0 0.5rem;
  border: 1.5px solid color-mix(in oklab, var(--accent) 45%, var(--card));
  border-radius: calc(var(--radius) * 0.6);
  background: var(--accent-tint);
  color: var(--accent);
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: none;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.rich-text-render h2[data-was-h1]::after {
  content: "";
  flex: 1 1 auto;
  height: 1px;
  background: color-mix(in oklab, var(--accent) 35%, var(--border));
}
.rich-text-render h2[data-was-h1]:first-child {
  margin-top: 0;
}
/* A title directly after its kicker sits close to it. */
.rich-text-render h2[data-was-h1] + h2 {
  margin-top: 0.75rem;
}

.rich-text-render h3 {
  counter-increment: subsection;
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  font-size: var(--a-sub-size, var(--h-section-size));
  font-weight: var(--a-sub-weight, var(--h-section-weight));
  letter-spacing: var(--a-sub-tracking, var(--h-section-tracking));
  text-transform: var(--a-sub-case, var(--h-section-case));
  line-height: 1.3;
  margin-top: 2.25rem;
  margin-bottom: 0.9rem;
}
/* Sub-number "1.2" — small, outlined, quieter than the section chip. */
.rich-text-render h3::before {
  content: counter(section) "." counter(subsection);
  flex: none;
  display: inline-flex;
  align-items: center;
  height: 1.7rem;
  padding: 0 0.55rem;
  border: 1.5px solid var(--border-heavy);
  border-radius: calc(var(--radius) * 0.5);
  color: var(--muted-foreground);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  transform: translateY(-0.15em);
}

.rich-text-render h4 {
  display: block;
  font-size: var(--a-minor-size, var(--h-eyebrow-size));
  font-weight: var(--a-minor-weight, var(--h-eyebrow-weight));
  letter-spacing: var(--a-minor-tracking, var(--h-eyebrow-tracking));
  text-transform: var(--a-minor-case, var(--h-eyebrow-case));
  line-height: 1.2;
  color: color-mix(in oklab, var(--accent) 70%, var(--foreground));
  margin-top: 1.75rem;
  margin-bottom: 0.6rem;
}

/* Role faces. The global "html body *" font rule carries !important, so the
   face has to be set at higher specificity to take effect. The chips keep
   the body face on purpose (numbers, not headings). */
/* Body face for everything in the article that isn't a heading — paragraphs,
   lists, tables. :where() keeps it at the global rule's specificity (0,0,2),
   so it wins over that by coming later but still loses to the role classes
   (.h-eyebrow, .h-card, .font-condensed…) the mounted blocks use, and to the
   heading rules below. */
html body :where(.rich-text-render, .rich-text-render *) { font-family: var(--a-body-font, var(--font-sans)) !important; }
/* Each heading rule also covers the heading's descendants: text wrapped in
   <strong>/<span> by the editor would otherwise match the body rule above
   and render in the body face (e.g. a serif body leaking into headings). */
html body .rich-text-render h1,
html body .rich-text-render h1 * { font-family: var(--h-page-title-font) !important; }
html body .rich-text-render h2,
html body .rich-text-render h2 * { font-family: var(--a-title-font, var(--h-page-title-font)) !important; }
html body .rich-text-render h2[data-was-h1],
html body .rich-text-render h2[data-was-h1] * { font-family: var(--a-kicker-font, var(--h-eyebrow-font)) !important; }
html body .rich-text-render h3,
html body .rich-text-render h3 * { font-family: var(--a-sub-font, var(--h-section-font)) !important; }
html body .rich-text-render h4,
html body .rich-text-render h4 * { font-family: var(--a-minor-font, var(--h-eyebrow-font)) !important; }
html body .rich-text-render h2[data-was-h1]::before,
html body .rich-text-render h3::before { font-family: var(--font-sans) !important; }

.rich-text-render img {
  max-width: 100%;
  height: auto;
  margin: 2rem auto;
  display: block;
  border: 1.5px solid var(--border-heavy);
  /* Theme radius: square in brutalist (--radius 0), rounded in modern. */
  border-radius: var(--radius);
}

/* Ad and banner creatives fill a fixed-height frame via absolute inset-0,
   so they must NOT pick up the article-image treatment above. That rule is
   unlayered and therefore outranks the Tailwind utilities on the image:
   its "margin: 2rem auto" offsets an absolutely-positioned image down from
   the frame's top edge (leaving a strip of card background against the
   border), "height: auto" stops it filling, and its border doubles up with
   the frame's own. Reset all three. */
.rich-text-render .inline-ad img {
  margin: 0;
  height: 100%;
  border: 0;
}

/* Mounted widgets (gallery/carousel, key highlights, also-read, pros & cons)
   size their own images via Tailwind classes. The article-image rule above is
   unlayered, so it outranks those classes and re-imposes 2rem block margins, a
   second border and height:auto — which is what pushed the gallery image down,
   left a gap above it and knocked the absolutely-positioned arrows out of
   alignment with the frame. Every one of those blocks carries the "not-prose"
   class, so scope the reset to that.

   Two classes + the element (0,2,1) outranks the (0,1,1) rule above, so this
   wins regardless of source order. "revert-layer" hands height back to the
   Tailwind utility layer rather than guessing a value here; where it isn't
   supported the declaration is dropped and height simply stays auto — the
   margin and border fixes still apply. */
.rich-text-render .not-prose img {
  margin: 0;
  border: 0;
  height: revert-layer;
}

.rich-text-render ul, .rich-text-render ol { padding-left: 1.75rem; margin: 1.35rem 0; }
.rich-text-render ul { list-style-type: disc; }
.rich-text-render ol { list-style-type: decimal; }
/* No fallback on font-size: an unset variable makes the declaration invalid,
   so it falls back to inheriting, which is what list items did before. */
.rich-text-render li { margin: 0.45rem 0; line-height: var(--a-body-leading, 1.8); font-size: var(--a-body-size); }
.rich-text-render li::marker { color: var(--accent); }

/* Pre-hydration layout for the Pros & Cons block (see components/feeds/ProsCons.tsx).
   It has to match <ProsConsCard>'s "grid gap-4 sm:grid-cols-2" exactly or the
   block resizes when the real card mounts, and injected article HTML can only
   carry inline styles, which can't hold a breakpoint. The split class is
   emitted only when both columns have items, mirroring the card's "both". */
.pros-cons-fallback-card { display: grid; gap: 16px; }
@media (min-width: 40rem) {
  .pros-cons-fallback-card.pros-cons-fallback-split { grid-template-columns: 1fr 1fr; }
}

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

/* ---- Modern theme: quieter, rounder tables ----------------------------
   Brutalist keeps the heavy frame and the solid accent header slab, which
   is the point of that theme. Modern trades them for the restrained data
   table it uses everywhere else: rounded frame, hairline rules, a muted
   header instead of a colour block, and no vertical grid lines — columns
   read fine from alignment alone, and dropping them removes most of the
   visual noise. Scoped so brutalist is untouched. */
[data-theme='modern'] .rich-text-render .table-wrap {
  border-width: 1px;
  border-color: var(--border);
  border-radius: var(--radius);
}

[data-theme='modern'] .rich-text-render thead th {
  background: var(--muted);
  color: var(--muted-foreground);
  font-weight: 600;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border);
}
[data-theme='modern'] .rich-text-render thead th + th {
  border-left: none;
}

[data-theme='modern'] .rich-text-render td + td {
  border-left: none;
}
[data-theme='modern'] .rich-text-render td:first-child {
  font-weight: 600;
}

/* Tint the hover from the accent rather than using --accent-tint flat: at
   6% it stays a hint on both the white and near-black surfaces, where the
   solid tint can read as a filled row. */
[data-theme='modern'] .rich-text-render tbody tr:hover td {
  background: color-mix(in srgb, var(--accent) 6%, transparent);
}

[data-theme='modern'] .rich-text-render .table-scroll::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 999px;
}
            `}</style>

            <ArticleImageLightbox>
  <div className="rich-text-render">
    <TableProcessor html={modifiedHtml} />
  </div>
</ArticleImageLightbox>
            <AlsoReadMount />
            <KeyHighlightsMount />
            <ProsConsMount />
            <SpecificationsMount />
            <GalleryMount />

            <div className="mt-10 space-y-4 border-t-[1.5px] border-border-heavy pt-6">
              {/* Sharing lives in the hero row at the top of the post only. */}
              <div className="flex items-center justify-between gap-4">
                <Link href="/blog" className="group inline-flex items-center gap-2 text-accent hover:underline font-bold text-sm transition-colors shrink-0">
                  <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                  All posts
                </Link>
                <BookmarkButton
                  postId={post.id}
                  initialBookmarked={isBookmarked}
                  showLabel
                  className="px-3 py-1.5 border-[1.5px] shrink-0"
                />
              </div>

              <AuthorCard
                author={post.author}
                articleCount={authorArticleCount}
                updatedLabel={wasUpdated ? `Updated ${formatDate(post.updatedAt)}` : null}
              />
            </div>
          </div>
        </FadeIn>

        {/* Social Sidebar + spotlight ad below it. Same min-[1440px] as the ToC
            so both gutters fill together — with only the left rail on, the page
            read as lopsided, a filled 216px rail against an empty 272px one.
            Safe at that width because both components are fluid: the social
            rows are min-w-0/flex-1 with truncation, and SpotlightAdRail is
            w-full with only a min-height. */}
        <div className="article-rail absolute inset-y-0 right-6 hidden min-[1440px]:block z-20">
          <FadeIn delay={0.2} className="sticky top-[5.25rem]">
            <SocialSidebar compact />
            {spotlightAds.length > 0 && (
              <div className="mt-8 h-[420px]">
                <SpotlightAdRail
                  ads={spotlightAds}
                  header={spotlightHeader}
                  title={spotlightTitle}
                />
              </div>
            )}
          </FadeIn>
        </div>
      </main>

      {/* EDITORIAL VERDICT — only on posts an editor actually scored — with
          the linked product's spec card and the trending list beside it on
          wide screens, or as a swipeable carousel below 1440px. Sits above
          the reader rating so the two read as claim then response. */}
      {endSlides.length > 0 && (
        // Above the sections that follow: without a verdict the side cards
        // hang in the gutters beside the poll and rating, whose full-width
        // FadeIn wrappers would otherwise paint over them and eat clicks.
        <FadeIn className="relative z-20">
          <ArticleEndCarousel slides={endSlides} />
        </FadeIn>
      )}

      {/* Poll, rating and comments: max-w-[59rem] = the article's 56rem column
          plus this wrapper's own 2 x 1.5rem padding, so each card is exactly
          as wide as the article above it. At max-w-4xl the padding came out
          of the 56rem and they were 48px narrower than the article. */}
      <FadeIn>
        <div className="max-w-[59rem] mx-auto px-6 mt-6 mb-6 md:mt-8 md:mb-8">
          <Poll />
        </div>
      </FadeIn>

      <FadeIn>
        <div className="max-w-[59rem] mx-auto px-6 mb-6 md:mb-8">
          <RatingMeter postId={post.id} />
        </div>
      </FadeIn>

      <FadeIn>
        <div className="max-w-[59rem] mx-auto px-6 mb-6 md:mb-8">
          <CommentSection postId={post.id} />
        </div>
      </FadeIn>

      {/* Continue reading — the reader's own unfinished articles, from
          localStorage. Replaces the old "Keep Reading" rail, which showed
          same-category posts directly above the tag-based Related Articles
          block: two rows of "here are other articles" back to back, drawn
          from overlapping pools. This one answers a different question, so
          the two no longer duplicate each other. Renders nothing on a first
          visit, which is why it needs no empty state.

          Wrapped to max-w-6xl so it shares an edge with <RelatedArticles />
          directly below, which is w-full max-w-6xl mx-auto px-6. The
          component caps itself at 1600px for the homepage, which is far
          wider than anything on this page. */}
      <FadeIn>
        <div className="mx-auto mb-8 w-full max-w-6xl">
          <ContinueReading excludeSlug={post.slug} />
        </div>
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