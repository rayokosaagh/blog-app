import { prisma } from "@/lib/prisma";
import TopStoryTilesList from "./TopStoryTilesList";

const TRENDING_WINDOW_DAYS = 7;

/**
 * Server component feeding the homepage "Top Stories" magazine grid — the 2×2
 * tiles that sit beside the featured carousel. Blends the two feeds the old
 * flanking lists used to show: 2 trending (most-viewed, recent window with an
 * all-time fallback) + 2 newest, deduplicated. Each tile carries a kind badge
 * so Trending and New read as complementary halves of one grid.
 */
export default async function TopStoryTiles() {
  const since = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const select = {
    id: true,
    slug: true,
    title: true,
    featuredImage: true,
    createdAt: true,
  };

  let trending = await prisma.post.findMany({
    where: { published: true, createdAt: { gte: since } },
    orderBy: { views: "desc" },
    take: 2,
    select,
  });

  // Fall back to all-time most-viewed if the recent window is thin.
  if (trending.length < 2) {
    const ids = trending.map((p) => p.id);
    const fill = await prisma.post.findMany({
      where: { published: true, id: { notIn: ids } },
      orderBy: { views: "desc" },
      take: 2 - trending.length,
      select,
    });
    trending = [...trending, ...fill];
  }

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
