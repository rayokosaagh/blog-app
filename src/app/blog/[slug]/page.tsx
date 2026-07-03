import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TocSidebar from "@/components/TocSidebar";
import SocialSidebar from "@/components/SocialSidebar";
import type { Metadata } from "next";
import MobileNav from "@/components/MobileNav";
import BackToTop from "@/components/BackToTop";
import Poll from "@/components/Poll";
import RatingMeter from "@/components/RatingMeter";
import KeepReading from "@/components/KeepReading";
import CommentSection from "@/components/CommentSection";
import TagIcon from "@/components/TagIcon";
import { sortTagsByOrder } from "@/lib/sortTags";
import ViewTracker from "@/components/ViewTracker";

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

  const modifiedHtml = html.replace(
    /<(h[1-4])([^>]*?)>([\s\S]*?)<\/h[1-4]>/gi,
    (match, tag, attributes, content) => {
      const cleanText = content
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();

      if (!cleanText) return match;

      const id = cleanText
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

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

  const orderedTags = sortTagsByOrder(post.tags, post.tagOrder);

  const relatedPosts = await prisma.post.findMany({
    where: { 
      published: true, 
      NOT: { id: post.id } 
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

  const readingTime = Math.max(
    1,
    Math.ceil(post.content.replace(/<[^>]*>/g, "").split(/\s+/).length / 200)
  );

  let processedContent = parseAdsShortcodes(post.content, ads);
  processedContent = parseBannerShortcodes(processedContent, banners);

  const { modifiedHtml, toc } = parseContentAndGenerateToc(processedContent);

  return (
  <div className="min-h-screen bg-background transition-colors duration-300 scroll-smooth">
    <ViewTracker postId={post.id} />
    <Navbar />

      {/* Hero Header */}
      <div className="relative w-full h-[420px] md:h-[500px] overflow-hidden">
        {post.featuredImage ? (
          <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

        <div className="absolute top-6 left-0 right-0 max-w-4xl mx-auto px-6 z-20">
          <nav className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-card/80 backdrop-blur-md border border-border rounded-full text-sm text-muted-foreground font-medium shadow-lg">
            <Link href="/" className="hover:text-foreground transition-all">Home</Link>
            <span className="text-border text-xs">/</span>
            <Link href="/blog" className="hover:text-foreground transition-all">Blog</Link>
            <span className="text-border text-xs">/</span>
            <span className="text-foreground truncate max-w-[250px]">{post.title}</span>
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-6 pb-10">
          {orderedTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {orderedTags.map((t) => (
                <Link
                  key={t.id}
                  href={`/blog?tag=${t.slug}`}
                  className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border border-white/25 transition-colors"
                >
                  <TagIcon icon={t.icon} className="inline-flex w-3.5 h-3.5 [&>svg]:w-full [&>svg]:h-full" />
                  {t.name}
                </Link>
              ))}
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-5">{post.title}</h1>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-white/60 shadow-xl shrink-0 bg-muted">
              {post.author.image ? (
                <img src={post.author.image} alt={post.author.name || "Author"} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
                  {post.author.name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div>
              <p className="text-white font-semibold text-lg">{post.author.name}</p>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <time>{formatDate(post.createdAt)}</time>
                <span>·</span>
                <span>{readingTime} min read</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-[1560px] mx-auto px-6 -mt-6 relative z-10 pb-15 flex flex-col 2xl:flex-row justify-center gap-8 items-start">
        {/* TOC Sidebar */}
        {toc.length > 0 && (
          <div className="hidden 2xl:block w-[340px] shrink-0 sticky top-28 z-20">
            <TocSidebar toc={toc} title={post.title} />
          </div>
        )}

        {/* Article Content */}
        <div className="w-full max-w-4xl bg-card border border-border rounded-2xl shadow-xl px-8 md:px-10 py-12 transition-colors duration-300">
          {/* Custom Typography + Image Styling */}
          <style>{`
            .rich-text-render { color: var(--foreground); }
            .rich-text-render p { color: var(--muted-foreground); line-height: 1.85; margin-bottom: 1.35rem; font-size: 1.0625rem; }
            .rich-text-render h1, .rich-text-render h2, .rich-text-render h3, .rich-text-render h4 {
              color: var(--foreground); font-weight: 700; margin-top: 2.25rem; margin-bottom: 0.85rem; scroll-margin-top: 100px;
            }
            .rich-text-render h1 { font-size: 1.875rem; }
            .rich-text-render h2 { font-size: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
            .rich-text-render h3 { font-size: 1.25rem; }

            .rich-text-render img {
              max-width: 100%;
              height: auto;
              border-radius: 12px;
              margin: 2rem auto;
              display: block;
              box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            }

            .rich-text-render ul, .rich-text-render ol { padding-left: 1.75rem; margin: 1.35rem 0; }
            .rich-text-render ul { list-style-type: disc; }
            .rich-text-render ol { list-style-type: decimal; }
            .rich-text-render li { margin: 0.45rem 0; line-height: 1.8; }
            .rich-text-render li::marker { color: #3b82f6; }

            .rich-text-render table { width: 100%; border-collapse: collapse; margin: 2rem 0; }
            .rich-text-render th, .rich-text-render td { padding: 0.85rem 1rem; border: 1px solid var(--border); text-align: left; }
            .rich-text-render th { background: rgba(0,0,0,0.03); font-weight: 600; }
            .dark .rich-text-render th { background: rgba(255,255,255,0.03); }
            .rich-text-render tr:nth-child(even) td { background: rgba(0,0,0,0.015); }
            .dark .rich-text-render tr:nth-child(even) td { background: rgba(255,255,255,0.015); }
          `}</style>

          {/* Main Article Content */}
          <div className="overflow-x-auto rounded-xl">
            <div
              className="rich-text-render prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: modifiedHtml }}
              suppressHydrationWarning
            />
          </div>

          {/* Author Bio */}
          <div className="mt-14 pt-8 border-t border-border flex items-center justify-between">
            <Link href="/blog" className="inline-flex items-center gap-2 text-accent hover:underline font-medium text-sm transition-colors">
              ← All posts
            </Link>

            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl overflow-hidden bg-muted ring-1 ring-border shrink-0">
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

              <div className="text-right">
                <p className="text-xs text-muted-foreground">Written by</p>
                <p className="text-sm font-semibold text-foreground">{post.author.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Sidebar */}
        <div className="hidden 2xl:block w-[340px] shrink-0 sticky top-28 z-20">
          <SocialSidebar />
        </div>
      </main>

      {/* POLL */}
      <div className="max-w-4xl mx-auto px-6 mt-4 mb-6">
        <Poll />
      </div>

      {/* RATING */}
      <div className="max-w-4xl mx-auto px-6 mb-12">
        <RatingMeter postId={post.id} />
      </div>

      {/* COMMENTS */}
      <div className="max-w-4xl mx-auto px-6 mb-12">
        <CommentSection postId={post.id} />
      </div>

      {/* Keep Reading */}
      <KeepReading relatedPosts={relatedPosts} />

      <Footer />
      <MobileNav toc={toc} />
      <BackToTop />
    </div>
  );
}