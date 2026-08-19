import { notFound } from "next/navigation";
import { APP_URL } from "@/lib/appUrl";
import { POST_CATEGORIES, getPostCategoryBySlug } from "@/lib/blog/categories";
import { buildRss, fetchFeedPosts, RSS_HEADERS, SITE_TITLE } from "@/lib/rss";

// Same cadence as the site feed.
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return POST_CATEGORIES.map((c) => ({ category: c.slug }));
}

/** Per-category feed: /news/rss.xml, /reviews/rss.xml, … */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category: slug } = await params;
  const def = getPostCategoryBySlug(slug);
  if (!def) notFound();

  const posts = await fetchFeedPosts(def.key);
  const xml = buildRss({
    posts,
    title: `${def.title} — ${SITE_TITLE}`,
    description: def.description,
    selfUrl: `${APP_URL}/${def.slug}/rss.xml`,
    siteUrl: `${APP_URL}/${def.slug}`,
  });
  return new Response(xml, { headers: RSS_HEADERS });
}
