"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Search, RotateCcw } from "lucide-react";
import type { SpecFacet } from "@/lib/gadgets/productFilters";

interface Props {
  /** Where "Apply" navigates to (e.g. "/products" or "/tag/phones"). */
  basePath: string;
  categories: { slug: string; name: string }[];
  brands: string[];
  /** Spec facets (Processor / RAM / Storage / …) for the current category. */
  facets: SpecFacet[];
  hideCategory?: boolean;
}

const SORTS = [
  { value: "", label: "Latest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
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
  hideCategory,
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const [search, setSearch] = useState(sp.get("search") ?? "");
  const [category, setCategory] = useState(sp.get("category") ?? "");
  const [brand, setBrand] = useState(sp.get("brand") ?? "");
  const [minPrice, setMinPrice] = useState(sp.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(sp.get("maxPrice") ?? "");
  const [sort, setSort] = useState(sp.get("sort") ?? "");
  const [specs, setSpecs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    facets.forEach((f) => {
      const v = sp.get(`spec_${f.key}`);
      if (v) init[f.key] = v;
    });
    return init;
  });

  const hasActive = Boolean(
    search ||
      category ||
      brand ||
      minPrice ||
      maxPrice ||
      sort ||
      Object.values(specs).some(Boolean)
  );

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
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (sort) params.set("sort", sort);
    for (const [k, v] of Object.entries(specs)) if (v) params.set(`spec_${k}`, v);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function clearAll() {
    setSearch("");
    setCategory("");
    setBrand("");
    setMinPrice("");
    setMaxPrice("");
    setSort("");
    setSpecs({});
    // Keep the tag context when clearing the applied filters.
    const tag = sp.get("tag");
    router.push(tag ? `${basePath}?tag=${encodeURIComponent(tag)}` : basePath);
  }

  return (
    <form
      onSubmit={apply}
      className="space-y-3 rounded-none border-2 border-border-heavy bg-card p-4 shadow-brutal lg:sticky lg:top-6"
    >
      <div className="flex items-center gap-2 border-b-2 border-border-heavy pb-2.5">
        <span className="flex h-7 w-7 items-center justify-center border-2 border-border-heavy bg-accent text-on-accent">
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </span>
        <h2 className="text-base font-extrabold tracking-tight text-foreground">Filters</h2>
      </div>

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

      <div>
        <label className={labelClass}>Price range</label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            className={control}
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            className={control}
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
    </form>
  );
}
