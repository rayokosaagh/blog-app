import { prisma } from "@/lib/prisma";
import MobileNewsTabs from "./MobileNewsTabs";

const ITEMS_TO_SHOW = 5;

export default async function MobileNewsHighlights() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [trendingPosts, latestPosts] = await Promise.all([
    prisma.post.findMany({
      where: {
        published: true,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { views: "desc" },
      take: ITEMS_TO_SHOW,
      select: { id: true, slug: true, title: true, featuredImage: true, views: true, createdAt: true },
    }),
    prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: ITEMS_TO_SHOW,
      select: { id: true, slug: true, title: true, featuredImage: true, createdAt: true },
    }),
  ]);

  // Fallback: if nothing was published in the last 7 days, fall back to
  // the all-time most-viewed published posts — same rule as the desktop
  // TrendingNews sidebar.
  const resolvedTrendingPosts =
    trendingPosts.length === 0
      ? await prisma.post.findMany({
          where: { published: true },
          orderBy: { views: "desc" },
          take: ITEMS_TO_SHOW,
          select: { id: true, slug: true, title: true, featuredImage: true, views: true, createdAt: true },
        })
      : trendingPosts;

  return <MobileNewsTabs trendingPosts={resolvedTrendingPosts} latestPosts={latestPosts} />;
}