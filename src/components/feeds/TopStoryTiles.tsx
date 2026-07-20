import { prisma } from "@/lib/prisma";
import TopStoryTilesList from "./TopStoryTilesList";

/**
 * Server component feeding the homepage "Top Stories" magazine grid — the 2×2
 * tiles that sit beside the featured carousel. Blends two feeds: 2 trending
 * (the most-viewed posts, all-time) + 2 newest, deduplicated. Each tile carries
 * a kind badge so Trending and New read as complementary halves of one grid.
 */
export default async function TopStoryTiles() {
  const select = {
    id: true,
    slug: true,
    title: true,
    featuredImage: true,
    createdAt: true,
  };

  // Trending = the most-viewed published posts, ranked purely by view count.
  const trending = await prisma.post.findMany({
    where: { published: true },
    orderBy: { views: "desc" },
    take: 2,
    select,
  });

  const trendingIds = trending.map((p) => p.id);
  const latest = await prisma.post.findMany({
    where: { published: true, id: { notIn: trendingIds } },
    orderBy: { createdAt: "desc" },
    take: 2,
    select,
  });

  const tiles = [
    ...trending.map((p) => ({ ...p, kind: "trending" as const })),
    ...latest.map((p) => ({ ...p, kind: "latest" as const })),
  ];

  if (tiles.length === 0) return null;

  return <TopStoryTilesList tiles={tiles} />;
}
