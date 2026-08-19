/**
 * RSS 2.0 document builder shared by the site feed (/rss.xml) and the
 * per-category feeds (/news/rss.xml, /reviews/rss.xml…). Lives in src/lib
 * because both route handlers need the same query shape and XML — one place
 * for escaping rules is one place for a CDATA bug to be fixed.
 */
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/appUrl";
import { getExcerpt } from "@/lib/postUtils";
import { getPostCategory } from "@/lib/blog/categories";
import type { PostCategory } from "@/generated/prisma";

export const FEED_SIZE = 30;

export const SITE_TITLE = "Blog — tech news, gadget reviews and spec comparisons";
export const SITE_DESCRIPTION =
  "Reviews, comparisons and news on the gadgets you care about.";

/**
 * XML text escaping. Post titles routinely contain `&` and quotes, and the
 * body goes into CDATA, so `]]>` has to be broken up or it closes the section
 * early and corrupts the rest of the document.
 */
export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

/** Newest published posts for a feed, optionally scoped to one category. */
export function fetchFeedPosts(category?: PostCategory) {
  return prisma.post.findMany({
    where: { published: true, ...(category && { category }) },
    orderBy: { createdAt: "desc" },
    take: FEED_SIZE,
    select: {
      title: true,
      slug: true,
      content: true,
      featuredImage: true,
      createdAt: true,
      category: true,
      author: { select: { name: true } },
      tags: { select: { name: true } },
    },
  });
}

type FeedPost = Awaited<ReturnType<typeof fetchFeedPosts>>[number];

export function buildRss({
  posts,
  title,
  description,
  /** Absolute URL of this feed, for the atom:link rel="self". */
  selfUrl,
  /** Absolute URL of the HTML page the feed mirrors. */
  siteUrl,
}: {
  posts: FeedPost[];
  title: string;
  description: string;
  selfUrl: string;
  siteUrl: string;
}): string {
  const items = posts
    .map((p) => {
      const url = `${APP_URL}/blog/${p.slug}`;
      const image = p.featuredImage
        ? p.featuredImage.startsWith("http")
          ? p.featuredImage
          : `${APP_URL}${p.featuredImage}`
        : null;
      // The editorial category leads the <category> list; tags follow. Both
      // are RSS "categories" to a reader app, but the first one is what most
      // clients surface as the item's section.
      const categories = [getPostCategory(p.category).label, ...p.tags.map((t) => t.name)];

      return `    <item>
      <title>${cdata(p.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${p.createdAt.toUTCString()}</pubDate>
      ${p.author?.name ? `<dc:creator>${cdata(p.author.name)}</dc:creator>` : ""}
      ${categories.map((c) => `<category>${cdata(c)}</category>`).join("\n      ")}
      <description>${cdata(getExcerpt(p.content, 55))}</description>
      ${image ? `<enclosure url="${escapeXml(image)}" type="image/jpeg" />` : ""}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${cdata(title)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${cdata(description)}</description>
    <language>en</language>
    <lastBuildDate>${(posts[0]?.createdAt ?? new Date()).toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}

export const RSS_HEADERS = {
  "Content-Type": "application/rss+xml; charset=utf-8",
  "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
};
