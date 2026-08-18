// src/components/GadgetCompare.tsx
import { prisma } from "@/lib/prisma";
import { CATEGORY_LIST, getCategoryDef } from "@/lib/gadgets/categories";
import GadgetCompareClient from "@/components/gadgets/GadgetCompareClient";
import { lookupEditorVerdicts } from "@/lib/gadgets/editorVerdicts";

interface GadgetCompareProps {
  defaultCategory?: string;
  defaultSlugs?: string[];
}

export default async function GadgetCompare({
  defaultCategory,
  defaultSlugs,
}: GadgetCompareProps) {
  const category = defaultCategory ?? CATEGORY_LIST[0]?.slug;
  const def = getCategoryDef(category);

  const categoryProducts = await prisma.product.findMany({
    where: { category: { slug: category }, published: true },
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true, brand: true, image: true },
  });

  // Use whatever slugs the URL gives us — including zero (empty table)
  // or one (a single remaining slot after a removal). No fallback to
  // "first two products in the category" anymore.
  const initialSlugs = defaultSlugs ?? [];

  const initialProducts = initialSlugs.length
    ? await prisma.product.findMany({
        where: { slug: { in: initialSlugs }, category: { slug: category } },
      })
    : [];

  const orderedInitialProducts = initialSlugs
    .map((s) => initialProducts.find((p) => p.slug === s))
    .filter(Boolean) as typeof initialProducts;

  // Server-rendered for the pair the URL arrived with, so a shared /compare
  // link shows the editor's verdict on first paint rather than after a
  // round-trip. Subsequent picks refetch it via /api/gadgets/compare.
  const editorVerdicts = await lookupEditorVerdicts(
    orderedInitialProducts.map((p) => p.slug)
  );

  return (
    <GadgetCompareClient
      key={`${category}-${initialSlugs.join(",")}`}
      categories={CATEGORY_LIST.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon }))}
      initialCategory={category}
      initialCategoryProducts={categoryProducts}
      initialProducts={orderedInitialProducts as any}
      initialDef={def}
      initialEditorVerdicts={editorVerdicts}
    />
  );
}