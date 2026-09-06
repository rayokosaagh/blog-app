import { prisma } from "@/lib/prisma";
import { GitCompare } from "lucide-react";
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
      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        <div className="h-1 bg-blue-500" />
        <div className="p-5 sm:p-6 flex items-start gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
            <GitCompare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1
              className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Latest comparisons
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Pick two gadgets from the same category to feature on the homepage.
            </p>
          </div>
        </div>
      </div>

      <ComparisonManager
        categories={CATEGORY_LIST.map((c) => ({ slug: c.slug, name: c.name }))}
        products={products}
        initialComparisons={comparisons}
      />
    </div>
  );
}