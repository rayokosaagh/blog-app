// src/app/dashboard/gadgets/comparisons/page.tsx
import { prisma } from "@/lib/prisma";
import ComparisonManager from "@/components/gadgets/ComparisonManager";
import { CATEGORY_LIST } from "@/lib/gadgets/categories";

export default async function GadgetComparisonsPage() {
  const [comparisons, products] = await Promise.all([
    prisma.comparison.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true, productA: true, productB: true },
    }),
    prisma.product.findMany({
      where: { published: true },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Latest Comparisons</h1>
      <p className="text-zinc-500 dark:text-zinc-400">
        Pick two gadgets from the same category to feature on the homepage.
      </p>
      <ComparisonManager
        categories={CATEGORY_LIST.map((c) => ({ slug: c.slug, name: c.name }))}
        products={products}
        initialComparisons={comparisons}
      />
    </div>
  );
}