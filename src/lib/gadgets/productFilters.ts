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
  { key: "gpuModel", label: "Graphics" },
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
  // Earbuds
  { key: "driver", label: "Driver" },
  { key: "codecs", label: "Codecs" },
  { key: "noiseCancellation", label: "Noise Cancellation" },
  { key: "ipRating", label: "IP Rating" },
  { key: "fit", label: "Fit" },
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

// Facets whose values are a magnitude plus a size unit. Editors enter these
// inconsistently — "12" and "12GB" are the same option to a reader, but as raw
// strings they became two entries in the dropdown. Bare numbers get the unit
// appended and the unit itself is case-normalised, so both collapse to "12GB".
const IMPLIED_UNIT: Record<string, string> = {
  ram: "GB",
  storage: "GB",
  installedRam: "GB",
  primarySsd: "GB",
};

/**
 * Canonical form of one facet token. Applied identically when building the
 * dropdown and when matching a product against it, so the two can't drift.
 */
export function normalizeSpecToken(key: string, token: string): string {
  const trimmed = token.trim();
  const unit = IMPLIED_UNIT[key];
  if (!unit) return trimmed;
  // "512" → "512GB"
  if (/^\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}${unit}`;
  // "512gb" / "1 tb" → "512GB" / "1TB"
  const m = trimmed.match(/^(\d+(?:\.\d+)?)\s*(gb|tb|mb)$/i);
  if (m) return `${m[1]}${m[2].toUpperCase()}`;
  return trimmed;
}

// Size units expressed in GB, so "1TB" sorts after "512GB" instead of before
// "128GB" the way a plain string sort put it.
const UNIT_SCALE: Record<string, number> = { MB: 1 / 1024, GB: 1, TB: 1024 };

function magnitude(v: string): number | null {
  const m = v.match(/^(\d+(?:\.\d+)?)\s*(MB|GB|TB)?$/i);
  if (!m) return null;
  const scale = m[2] ? UNIT_SCALE[m[2].toUpperCase()] ?? 1 : 1;
  return Number(m[1]) * scale;
}

/** Numeric-aware ordering for facet dropdowns; falls back to alphabetical. */
export function compareSpecValues(a: string, b: string): number {
  const na = magnitude(a);
  const nb = magnitude(b);
  if (na !== null && nb !== null) return na - nb;
  if (na !== null) return -1; // numbers first, then free text
  if (nb !== null) return 1;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

// A spec cell may list several variants in one string ("8/12", "8, 12",
// "128 | 256"). Split it into individual, trimmed, normalized tokens.
const SPEC_VALUE_SEP = /\s*[/,|]\s*/;
export function splitSpecValues(raw: unknown, key = ""): string[] {
  if (typeof raw === "number") return [normalizeSpecToken(key, String(raw))];
  if (typeof raw !== "string") return [];
  return raw
    .split(SPEC_VALUE_SEP)
    .map((s) => normalizeSpecToken(key, s))
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
    // Normalize the incoming param too: links shared before this change (and
    // hand-edited URLs) may still carry the un-normalized "12".
    if (!splitSpecValues(blob?.[key], key).includes(normalizeSpecToken(key, val))) return false;
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

export interface SpecFacetResult {
  facets: SpecFacet[];
  /**
   * True when the rows in scope span more than one gadget category, so spec
   * facets are withheld. The sidebar turns this into a "pick a category" hint.
   */
  needsCategory: boolean;
}

/**
 * Build the list of available spec facets (key, label, distinct values) from a
 * set of product spec blobs.
 *
 * Facets are only produced when every row in scope belongs to the same
 * category. `FILTERABLE_SPECS` covers all four categories at once, and the
 * labels deliberately repeat across them — laptops store their CPU under
 * `processorModel`, phones under `chipset`, but both render as "Processor". So
 * an unscoped listing showed Processor, RAM and Storage twice each, with one
 * copy always empty for any given product. Scoping to a single category makes
 * every dropdown apply to every product on the page.
 */
export function computeSpecFacets(
  rows: { specs: unknown; category?: { slug: string } | null }[]
): SpecFacetResult {
  const categories = new Set(rows.map((r) => r.category?.slug).filter(Boolean));
  if (categories.size > 1) return { facets: [], needsCategory: true };

  const facets = FILTERABLE_SPECS.map(({ key, label }) => {
    const set = new Set<string>();
    for (const r of rows) {
      const specs = r.specs as Record<string, unknown> | null;
      // Split multi-variant values ("8/12") so each variant is its own facet.
      for (const token of splitSpecValues(specs?.[key], key)) set.add(token);
    }
    return { key, label, values: Array.from(set).sort(compareSpecValues) };
  }).filter((f) => f.values.length > 0);

  return { facets, needsCategory: false };
}
