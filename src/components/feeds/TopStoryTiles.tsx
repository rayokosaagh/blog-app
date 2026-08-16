import TopStoryTilesList from "./TopStoryTilesList";

export interface TopStoryPost {
  id: string;
  slug: string;
  title: string;
  featuredImage: string | null;
  createdAt: Date;
  views: number;
}

/**
 * The 2x2 tile strip under the featured carousel.
 *
 * Previously this blended "2 trending + 2 newest", which put the newest posts
 * directly above the Latest Posts feed that exists to show exactly that — and
 * because the most-viewed posts on this site are also recent, in practice all
 * four tiles reappeared in the feed below. The strip is now purely the four
 * most-read posts, so it answers a question the feed underneath does not.
 *
 * The posts are supplied by the homepage rather than fetched here, because
 * page.tsx needs the same ids to exclude them from Latest Posts — one query,
 * one source of truth.
 */
export default function TopStoryTiles({ posts }: { posts: TopStoryPost[] }) {
  if (posts.length === 0) return null;

  // Rank comes from array position: the list arrives ordered by views desc.
  const tiles = posts.map((p, i) => ({ ...p, rank: i + 1 }));

  return <TopStoryTilesList tiles={tiles} />;
}
