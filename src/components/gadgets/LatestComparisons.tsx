import { prisma } from "@/lib/prisma";
import LatestComparisonsClient from "@/components/gadgets/LatestComparisonsClient";

export default async function LatestComparisons({ take = 4 }: { take?: number }) {
  const comparisons = await prisma.comparison.findMany({
    where: { active: true },
    take,
    orderBy: { order: "asc" },
    include: { category: true, productA: true, productB: true },
  });

  if (comparisons.length === 0) return null;

  return <LatestComparisonsClient comparisons={comparisons} />;
}