// src/components/GadgetCompare.tsx
import { prisma } from "@/lib/prisma";
import { CATEGORY_LIST, getCategoryDef } from "@/lib/gadgets/categories";
import GadgetCompareClient from "@/components/GadgetCompareClient";

interface GadgetCompareProps {
  defaultCategory?: string; // e.g. "mobiles" — falls back to first registered category
  defaultSlugs?: string[];  // e.g. ["iphone-17-pro-max", "samsung-galaxy-s26-ultra"]
}

export default async function GadgetCompare({
  defaultCategory,
  defaultSlugs,
}: GadgetCompareProps) {
  const category = defaultCategory ?? CATEGORY_LIST[0]?.slug;
  const def = getCategoryDef(category);

  // Products for the initial category (feeds the picker dropdowns client-side)
  const categoryProducts = await prisma.product.findMany({
    where: { category: { slug: category }, published: true },
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true, brand: true, image: true },
  });

  // Pre-load an initial comparison if slugs were given, otherwise default to
  // the first two published products in the category so the widget isn't empty.
  const initialSlugs =
    defaultSlugs && defaultSlugs.length >= 2
      ? defaultSlugs
      : categoryProducts.slice(0, 2).map((p) => p.slug);

  const initialProducts = initialSlugs.length
    ? await prisma.product.findMany({
        where: { slug: { in: initialSlugs }, category: { slug: category } },
      })
    : [];

  // preserve chosen order
  const orderedInitialProducts = initialSlugs
    .map((s) => initialProducts.find((p) => p.slug === s))
    .filter(Boolean) as typeof initialProducts;

  return (
    <GadgetCompareClient
      categories={CATEGORY_LIST.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon }))}
      initialCategory={category}
      initialCategoryProducts={categoryProducts}
      initialProducts={orderedInitialProducts as any}
      initialDef={def}
    />
  );
}