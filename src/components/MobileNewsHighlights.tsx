import { prisma } from "@/lib/prisma";
import MobileNewsTabs from "./MobileNewsTabs";

const ITEMS_TO_SHOW = 8;

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
      select: { id: true, slug: true, title: true, featuredImage: true, views: true },
    }),
    prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: ITEMS_TO_SHOW,
      select: { id: true, slug: true, title: true, featuredImage: true, createdAt: true },
    }),
  ]);

  return <MobileNewsTabs trendingPosts={trendingPosts} latestPosts={latestPosts} />;
}