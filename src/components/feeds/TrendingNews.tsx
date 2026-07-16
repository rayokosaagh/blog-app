import { prisma } from "@/lib/prisma";
import TrendingNewsList from "./TrendingNewsList";

const TRENDING_WINDOW_DAYS = 7;
const ITEMS_TO_SHOW = 5;

export default async function TrendingNews() {
  const since = new Date(
    Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  const selectFields = {
    id: true,
    slug: true,
    title: true,
    featuredImage: true,
    views: true,
    createdAt: true,
  };

  const recentPosts = await prisma.post.findMany({
    where: { published: true, createdAt: { gte: since } },
    orderBy: { views: "desc" },
    take: ITEMS_TO_SHOW,
    select: selectFields,
  });

  let posts = recentPosts;

  if (posts.length < ITEMS_TO_SHOW) {
    const excludeIds = posts.map((p) => p.id);
    const fillerPosts = await prisma.post.findMany({
      where: {
        published: true,
        id: { notIn: excludeIds },
      },
      orderBy: { views: "desc" },
      take: ITEMS_TO_SHOW,
      select: selectFields,
    });
    posts = [...posts, ...fillerPosts];
  }

  // Rank purely by views across the combined pool — recency only
  // decided which posts were eligible to be pulled in, not their
  // final order. Without this, a post inside the 7-day window would
  // always outrank a higher-viewed post outside it.
  posts = posts
    .sort((a, b) => b.views - a.views)
    .slice(0, ITEMS_TO_SHOW);

  if (posts.length === 0) return null;

  return <TrendingNewsList posts={posts} />;
}