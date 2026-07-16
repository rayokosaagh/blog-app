import { prisma } from "@/lib/prisma";
import MobileNewsTabs from "./MobileNewsTabs";

const ITEMS_TO_SHOW = 5;

export default async function MobileNewsHighlights() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const selectFields = {
    id: true,
    slug: true,
    title: true,
    featuredImage: true,
    views: true,
    createdAt: true,
  };

  const [recentPosts, latestPosts] = await Promise.all([
    prisma.post.findMany({
      where: {
        published: true,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { views: "desc" },
      take: ITEMS_TO_SHOW,
      select: selectFields,
    }),
    prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: ITEMS_TO_SHOW,
      select: { id: true, slug: true, title: true, featuredImage: true, createdAt: true },
    }),
  ]);

  let trendingPosts = recentPosts;

  // Top up with all-time most-viewed posts whenever the recent window
  // doesn't fill every slot — matches TrendingNews (desktop sidebar).
  if (trendingPosts.length < ITEMS_TO_SHOW) {
    const excludeIds = trendingPosts.map((p) => p.id);
    const fillerPosts = await prisma.post.findMany({
      where: {
        published: true,
        id: { notIn: excludeIds },
      },
      orderBy: { views: "desc" },
      take: ITEMS_TO_SHOW,
      select: selectFields,
    });
    trendingPosts = [...trendingPosts, ...fillerPosts];
  }

  // Option B: views win globally — recency only decided which posts
  // were eligible to be pulled in first, not their final rank.
  trendingPosts = trendingPosts
    .sort((a, b) => b.views - a.views)
    .slice(0, ITEMS_TO_SHOW);

  return <MobileNewsTabs trendingPosts={trendingPosts} latestPosts={latestPosts} />;
}