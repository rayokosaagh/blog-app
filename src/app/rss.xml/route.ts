// src/app/rss.xml/route.ts
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/appUrl";
import { getExcerpt } from "@/lib/postUtils";

// Matches sitemap.ts: regenerated hourly so a post published after a deploy
// reaches subscribers without a rebuild.
export const revalidate = 3600;

const FEED_SIZE = 30;

const SITE_TITLE = "Blog — tech news, gadget reviews and spec comparisons";
const SITE_DESCRIPTION =
  "Reviews, comparisons and news on the gadgets you care about.";

/**
 * XML text escaping. Post titles routinely contain `&` and quotes, and the
 * body goes into CDATA, so `]]>` has to be broken up or it closes the section
 * early and corrupts the rest of the document.
 */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: FEED_SIZE,
    select: {
      title: true,
      slug: true,
      content: true,
      featuredImage: true,
      createdAt: true,
      author: { select: { name: true } },
      tags: { select: { name: true } },
    },
  });

  const items = posts
    .map((p) => {
      const url = `${APP_URL}/blog/${p.slug}`;
      const image = p.featuredImage
        ? p.featuredImage.startsWith("http")
          ? p.featuredImage
          : `${APP_URL}${p.featuredImage}`
        : null;

      return `    <item>
      <title>${cdata(p.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${p.createdAt.toUTCString()}</pubDate>
      ${p.author?.name ? `<dc:creator>${cdata(p.author.name)}</dc:creator>` : ""}
      ${p.tags.map((t) => `<category>${cdata(t.name)}</category>`).join("\n      ")}
      <description>${cdata(getExcerpt(p.content, 55))}</description>
      ${image ? `<enclosure url="${escapeXml(image)}" type="image/jpeg" />` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${cdata(SITE_TITLE)}</title>
    <link>${escapeXml(APP_URL)}</link>
    <description>${cdata(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${(posts[0]?.createdAt ?? new Date()).toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${APP_URL}/rss.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
