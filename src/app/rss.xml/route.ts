import { APP_URL } from "@/lib/appUrl";
import {
  buildRss,
  fetchFeedPosts,
  RSS_HEADERS,
  SITE_DESCRIPTION,
  SITE_TITLE,
} from "@/lib/rss";

// Matches sitemap.ts: regenerated hourly so a post published after a deploy
// reaches subscribers without a rebuild.
export const revalidate = 3600;

/** Site-wide feed, every category. Per-category feeds live at /{category}/rss.xml. */
export async function GET() {
  const posts = await fetchFeedPosts();
  const xml = buildRss({
    posts,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    selfUrl: `${APP_URL}/rss.xml`,
    siteUrl: APP_URL,
  });
  return new Response(xml, { headers: RSS_HEADERS });
}
