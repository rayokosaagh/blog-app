import { prisma } from "@/lib/prisma";
import TrendingNewsList from "./TrendingNewsList";

const TRENDING_WINDOW_DAYS = 7;
const ITEMS_TO_SHOW = 5;

export default async function TrendingNews() {
  const since = new Date(
    Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  let posts = await prisma.post.findMany({
    where: { published: true, createdAt: { gte: since } },
    orderBy: { views: "desc" },
    take: ITEMS_TO_SHOW,
    select: {
      id: true,
      slug: true,
      title: true,
      featuredImage: true,
      views: true,
      createdAt: true,
    },
  });

  // Fallback: if no posts were published in the last 7 days, show the
  // all-time most-viewed published posts instead.
  if (posts.length === 0) {
    posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { views: "desc" },
      take: ITEMS_TO_SHOW,
      select: {
        id: true,
        slug: true,
        title: true,
        featuredImage: true,
        views: true,
        createdAt: true,
      },
    });
  }

  if (posts.length === 0) return null;

  return <TrendingNewsList posts={posts} />;
}