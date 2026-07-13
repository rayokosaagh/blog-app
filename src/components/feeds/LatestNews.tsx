import { prisma } from "@/lib/prisma";
import LatestNewsList from "./LatestNewsList";

const ITEMS_TO_SHOW = 5;

export default async function LatestNews() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: ITEMS_TO_SHOW,
    select: { id: true, slug: true, title: true, featuredImage: true, createdAt: true },
  });

  return <LatestNewsList posts={posts} />;
}