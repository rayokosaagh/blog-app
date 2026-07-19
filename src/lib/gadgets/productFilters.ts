import type { Prisma } from "@/generated/prisma";

type SearchParams = { [key: string]: string | string[] | undefined };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Spec keys (from the `specs` JSON) exposed as sidebar facet filters, in order.
 * A facet only appears when the relevant products actually have values for it,
 * so categories without a given spec (e.g. earbuds have no chipset) just skip it.
 */
export const FILTERABLE_SPECS = [
  { key: "chipset", label: "Processor" },
  { key: "ram", label: "RAM" },
  { key: "storage", label: "Storage" },
  { key: "displayType", label: "Display" },
  { key: "os", label: "OS" },
] as const;

export interface SpecFacet {
  key: string;
  label: string;
  values: string[];
}

/**
 * Shared product filter/sort logic driven by URL search params, used by the
 * /products listing and the tag pages (via ProductFilterSidebar).
 */
export function buildProductWhere(
  sp: SearchParams,
  extra?: Prisma.ProductWhereInput
): Prisma.ProductWhereInput {
  const search = first(sp.search);
  const category = first(sp.category);
  const brand = first(sp.brand);
  const minRaw = first(sp.minPrice);
  const maxRaw = first(sp.maxPrice);
  const min = minRaw ? Number(minRaw) : undefined;
  const max = maxRaw ? Number(maxRaw) : undefined;

  const price: Prisma.FloatNullableFilter = {};
  if (min !== undefined && !Number.isNaN(min)) price.gte = min;
  if (max !== undefined && !Number.isNaN(max)) price.lte = max;
  const hasPrice = price.gte !== undefined || price.lte !== undefined;

  // Each active spec facet becomes a JSON-path equality condition.
  const specConditions: Prisma.ProductWhereInput[] = [];
  for (const { key } of FILTERABLE_SPECS) {
    const val = first(sp[`spec_${key}`]);
    if (val) specConditions.push({ specs: { path: [key], equals: val } });
  }

  return {
    published: true,
    ...extra,
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(brand ? { brand } : {}),
    ...(hasPrice ? { priceFrom: price } : {}),
    ...(specConditions.length ? { AND: specConditions } : {}),
  };
}

export function buildProductOrderBy(sp: SearchParams): Prisma.ProductOrderByWithRelationInput {
  switch (first(sp.sort)) {
    case "price-asc":
      return { priceFrom: { sort: "asc", nulls: "last" } };
    case "price-desc":
      return { priceFrom: { sort: "desc", nulls: "last" } };
    case "name":
      return { name: "asc" };
    default:
      return { createdAt: "desc" };
  }
}

export function hasProductFilters(sp: SearchParams): boolean {
  const base =
    first(sp.search) ||
    first(sp.category) ||
    first(sp.brand) ||
    first(sp.minPrice) ||
    first(sp.maxPrice) ||
    first(sp.sort);
  // Note: `tag` is intentionally excluded — it's the page context, not a
  // user-applied filter, so it doesn't count toward "filtered".
  const spec = FILTERABLE_SPECS.some((f) => first(sp[`spec_${f.key}`]));
  return Boolean(base || spec);
}

/**
 * Build the list of available spec facets (key, label, distinct values) from a
 * set of product spec blobs. Used to populate the sidebar dropdowns.
 */
export function computeSpecFacets(rows: { specs: unknown }[]): SpecFacet[] {
  return FILTERABLE_SPECS.map(({ key, label }) => {
    const set = new Set<string>();
    for (const r of rows) {
      const specs = r.specs as Record<string, unknown> | null;
      const v = specs?.[key];
      if (typeof v === "string" && v.trim()) set.add(v.trim());
    }
    return { key, label, values: Array.from(set).sort() };
  }).filter((f) => f.values.length > 0);
}
