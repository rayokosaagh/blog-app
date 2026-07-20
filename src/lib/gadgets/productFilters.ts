import type { Prisma } from "@/generated/prisma";

type SearchParams = { [key: string]: string | string[] | undefined };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Spec keys (from the `specs` JSON) exposed as sidebar facet filters, in order.
 * A facet only appears when the relevant products actually have values for it,
 * so categories without a given spec (e.g. earbuds have no chipset) just skip it.
 */
export const FILTERABLE_SPECS = [
  // Laptops (their spec keys differ from phones)
  { key: "laptopType", label: "Type" },
  { key: "processorModel", label: "Processor" },
  { key: "graphicsType", label: "Graphics" },
  { key: "installedRam", label: "RAM" },
  { key: "primarySsd", label: "Storage" },
  { key: "panelType", label: "Panel" },
  { key: "operatingSystem", label: "OS" },
  // Smartphones
  { key: "chipset", label: "Processor" },
  { key: "ram", label: "RAM" },
  { key: "storage", label: "Storage" },
  { key: "displayType", label: "Display" },
  { key: "os", label: "OS" },
  // Shared across categories
  { key: "screenSize", label: "Screen" },
  { key: "refreshRate", label: "Refresh" },
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

  // NOTE: spec facet filters (RAM, storage, …) are intentionally NOT applied
  // here. A spec value can list multiple variants, e.g. RAM "8/12" means the
  // product ships with both 8GB and 12GB — so it must match a filter for "8"
  // OR "12". That per-token logic can't be expressed as a JSON `equals`, so
  // specs are filtered in application code via `productMatchesSpecFilters`.

  return {
    published: true,
    ...extra,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(brand ? { brand } : {}),
    ...(hasPrice ? { priceFrom: price } : {}),
  };
}

// A spec cell may list several variants in one string ("8/12", "8, 12",
// "128 | 256"). Split it into individual, trimmed tokens.
const SPEC_VALUE_SEP = /\s*[/,|]\s*/;
export function splitSpecValues(raw: unknown): string[] {
  if (typeof raw === "number") return [String(raw)];
  if (typeof raw !== "string") return [];
  return raw
    .split(SPEC_VALUE_SEP)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Whether a product's spec blob satisfies every active spec facet filter.
 * A multi-variant value ("8/12") matches a filter for any of its tokens, so a
 * phone with "8/12" RAM shows up under both the 8GB and 12GB filters.
 */
export function productMatchesSpecFilters(specs: unknown, sp: SearchParams): boolean {
  const blob = (specs ?? null) as Record<string, unknown> | null;
  for (const { key } of FILTERABLE_SPECS) {
    const val = first(sp[`spec_${key}`]);
    if (!val) continue;
    if (!splitSpecValues(blob?.[key]).includes(val)) return false;
  }
  return true;
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
      // Split multi-variant values ("8/12") so each variant is its own facet.
      for (const token of splitSpecValues(specs?.[key])) set.add(token);
    }
    return { key, label, values: Array.from(set).sort() };
  }).filter((f) => f.values.length > 0);
}
