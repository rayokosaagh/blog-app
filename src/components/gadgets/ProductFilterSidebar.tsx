"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Search, RotateCcw, ChevronDown } from "lucide-react";
import type { SpecFacet } from "@/lib/gadgets/productFilters";

interface Props {
  /** Where "Apply" navigates to (e.g. "/products" or "/tag/phones"). */
  basePath: string;
  categories: { slug: string; name: string }[];
  brands: string[];
  /** Spec facets (Processor / RAM / Storage / …) for the current category. */
  facets: SpecFacet[];
  /**
   * Set when the listing spans several gadget categories, so no spec facets
   * were computed — a phone's "Processor" and a laptop's are different fields.
   */
  needsCategory?: boolean;
  hideCategory?: boolean;
}

const SORTS = [
  { value: "", label: "Latest" },
  { value: "name", label: "Name (A–Z)" },
];

const control =
  "w-full rounded-none border-2 border-border-heavy bg-background px-2.5 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40";
const labelClass =
  "mb-1 block truncate text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground";

export default function ProductFilterSidebar({
  basePath,
  categories,
  brands,
  facets,
  needsCategory,
  hideCategory,
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  // On mobile the filter form collapses behind a toggle so it doesn't push the
  // product grid far down the page. Always expanded on lg+ (see `lg:block`).
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState(sp.get("search") ?? "");
  const [category, setCategory] = useState(sp.get("category") ?? "");
  const [brand, setBrand] = useState(sp.get("brand") ?? "");
  const [sort, setSort] = useState(sp.get("sort") ?? "");
  const [specs, setSpecs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    facets.forEach((f) => {
      const v = sp.get(`spec_${f.key}`);
      if (v) init[f.key] = v;
    });
    return init;
  });

  const activeCount = [
    search,
    category,
    brand,
    sort,
    ...Object.values(specs),
  ].filter(Boolean).length;
  const hasActive = activeCount > 0;

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    // Always preserve the category (even when the control is hidden because
    // category tabs drive it), so applying other filters keeps the tab.
    if (category) params.set("category", category);
    // Preserve the tag context (the tag page is merged into /products).
    const tag = sp.get("tag");
    if (tag) params.set("tag", tag);
    if (brand) params.set("brand", brand);
    if (sort) params.set("sort", sort);
    for (const [k, v] of Object.entries(specs)) if (v) params.set(`spec_${k}`, v);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function clearAll() {
    setSearch("");
    setCategory("");
    setBrand("");
    setSort("");
    setSpecs({});
    // Keep the tag context when clearing the applied filters.
    const tag = sp.get("tag");
    router.push(tag ? `${basePath}?tag=${encodeURIComponent(tag)}` : basePath);
  }

  return (
    <form
      onSubmit={apply}
      className="space-y-3 rounded-none border-2 border-border-heavy bg-card p-4 shadow-brutal"
    >
      <div className="flex items-center gap-2 border-b-2 border-border-heavy pb-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-border-heavy bg-accent text-on-accent">
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </span>
        <h2 className="text-base font-extrabold tracking-tight text-foreground">Filters</h2>

        {/* Mobile-only expand/collapse toggle (form stays open on lg+) */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          className="brutal-press ml-auto flex items-center gap-1.5 rounded-none border-2 border-border-heavy bg-card px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-foreground shadow-brutal-sm lg:hidden"
        >
          {hasActive && (
            <span className="flex h-4 min-w-4 items-center justify-center border border-border-heavy bg-accent px-1 text-[9px] leading-none text-on-accent">
              {activeCount}
            </span>
          )}
          {mobileOpen ? "Hide" : "Show"}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-150 ${mobileOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Collapsible body — hidden on mobile until toggled, always shown on lg+ */}
      <div className={`${mobileOpen ? "block" : "hidden"} space-y-3 lg:block`}>
      <div>
        <label className={labelClass}>Search</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className={`${control} pl-8`}
          />
        </div>
      </div>

      {/* Compact 2-column grid — category, brand, spec facets and sort */}
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-3">
        {!hideCategory && (
          <div>
            <label className={labelClass}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={control}>
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={labelClass}>Brand</label>
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className={control}>
            <option value="">All</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Spec facets — vary per category (RAM, Storage, Processor, …) */}
        {facets.map((f) => (
          <div key={f.key}>
            <label className={labelClass}>{f.label}</label>
            <select
              value={specs[f.key] ?? ""}
              onChange={(e) => setSpecs((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className={control}
            >
              <option value="">All</option>
              {f.values.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        ))}

        {needsCategory && (
          <p className="col-span-2 border-2 border-dashed border-border px-2.5 py-2 text-[11px] font-bold leading-snug text-muted-foreground">
            Pick a category above to filter by specs — processor, RAM, storage
            and the rest differ per gadget type.
          </p>
        )}

        <div>
          <label className={labelClass}>Sort by</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={control}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          className="brutal-press flex-1 rounded-none border-2 border-border-heavy bg-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-on-accent shadow-brutal-sm"
        >
          Apply
        </button>
        {hasActive && (
          <button
            type="button"
            onClick={clearAll}
            aria-label="Clear filters"
            className="brutal-press flex h-10 w-10 items-center justify-center border-2 border-border-heavy bg-card text-muted-foreground shadow-brutal-sm hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
      </div>
    </form>
  );
}
