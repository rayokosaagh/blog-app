import { prisma } from "@/lib/prisma";
import LatestComparisonsClient from "@/components/gadgets/LatestComparisonsClient";

const productCard = { select: { slug: true, name: true, image: true } } as const;

interface RelatedComparisonsProps {
  /** Category the page opened on; its comparisons are listed first. */
  categorySlug?: string;
  /** Products currently on screen — a comparison of exactly these is skipped. */
  excludeSlugs?: string[];
  take?: number;
}

// "You may like" rail under /compare: other curated comparisons, same category
// first. Built from the URL the page arrived with, so it doesn't follow picks
// made on the page afterwards.
export default async function RelatedComparisons({
  categorySlug,
  excludeSlugs = [],
  take = 4,
}: RelatedComparisonsProps) {
  // Curated comparisons are a short, hand-made list, so fetch them all and
  // rank in memory rather than issuing a query per bucket.
  const all = await prisma.comparison.findMany({
    where: {
      active: true,
      productA: { published: true },
      productB: { published: true },
    },
    orderBy: { order: "asc" },
    take: 50,
    select: {
      id: true,
      category: { select: { slug: true, name: true } },
      productA: productCard,
      productB: productCard,
    },
  });

  const onScreen = new Set(excludeSlugs);
  const comparisons = all
    .filter((c) => !(onScreen.has(c.productA.slug) && onScreen.has(c.productB.slug)))
    .sort(
      (a, b) =>
        Number(b.category.slug === categorySlug) - Number(a.category.slug === categorySlug)
    )
    .slice(0, take);

  if (comparisons.length === 0) return null;

  return (
    <div className="mt-12">
      <LatestComparisonsClient
        comparisons={comparisons}
        title="You May Like"
        subtitle="More head-to-head comparisons"
      />
    </div>
  );
}
