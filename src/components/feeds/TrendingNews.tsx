import { prisma } from "@/lib/prisma";
import TrendingNewsList from "./TrendingNewsList";

const ITEMS_TO_SHOW = 5;

export default async function TrendingNews() {
  // Trending = the most-viewed published posts, ranked purely by view count.
  const posts = await prisma.post.findMany({
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

  if (posts.length === 0) return null;

  return <TrendingNewsList posts={posts} />;
}