// src/components/GadgetCompareClient.tsx
"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { GadgetCategoryDef } from "@/lib/gadgets/types";

interface CategoryOption { slug: string; name: string; icon?: string }
interface ProductLite { id: string; slug: string; name: string; brand: string; image?: string | null }
interface Product extends ProductLite {
  priceFrom?: number | null;
  specs: Record<string, any>;
}

interface GadgetCompareClientProps {
  categories: CategoryOption[];
  initialCategory: string;
  initialCategoryProducts: ProductLite[];
  initialProducts: Product[];
  initialDef?: GadgetCategoryDef;
}

// ─────────────────────────────────────────────────────────────
// Small animated on/off switch, reused for the two diff toggles.
// Styled the same way as the toggle in ComparisonManager so the
// admin and public-facing UIs feel consistent.
// ─────────────────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300"
    >
      <span
        className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="inline-block h-4 w-4 rounded-full bg-white shadow"
          style={{ marginLeft: checked ? "20px" : "3px" }}
        />
      </span>
      {label}
    </button>
  );
}

export default function GadgetCompareClient({
  categories,
  initialCategory,
  initialCategoryProducts,
  initialProducts,
  initialDef,
}: GadgetCompareClientProps) {
  const [category, setCategory] = useState(initialCategory);
  const [def, setDef] = useState<GadgetCategoryDef | undefined>(initialDef);
  const [categoryProducts, setCategoryProducts] = useState<ProductLite[]>(initialCategoryProducts);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [highlightDiff, setHighlightDiff] = useState(true);
  const [onlyDiff, setOnlyDiff] = useState(false);

  const maxSlots = def?.maxCompare ?? 3;
  const selectedSlugs = products.map((p) => p.slug);

  // Switching category: fetch its product list fresh, clear the comparison.
  async function handleCategoryChange(slug: string) {
    setCategory(slug);
    setProducts([]);
    setLoading(true);
    try {
      const res = await fetch(`/api/gadgets/products?category=${slug}`);
      const data = await res.json();
      setCategoryProducts(data.products ?? []);
      setDef(data.categoryDef);
    } finally {
      setLoading(false);
    }
  }

  // Add / swap a product into a comparison slot, always scoped to `category`.
  async function handlePick(slotIndex: number, productSlug: string) {
    if (!productSlug) {
      setProducts((prev) => prev.filter((_, i) => i !== slotIndex));
      return;
    }
    setLoading(true);
    try {
      const nextSlugs = [...selectedSlugs];
      nextSlugs[slotIndex] = productSlug;
      const params = new URLSearchParams({ category });
      nextSlugs.filter(Boolean).forEach((s, i) => params.set(`p${i + 1}`, s));
      const res = await fetch(`/api/gadgets/compare?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setProducts(data.products);
    } finally {
      setLoading(false);
    }
  }

  // Spec groups shown in the table — filtered down to only-differing
  // fields when the "Show only Differences" toggle is on.
  const groups = useMemo(() => {
    if (!def) return [];
    if (!onlyDiff) return def.groups;
    return def.groups
      .map((g) => ({
        ...g,
        fields: g.fields.filter((f) => {
          const vals = products.map((p) => JSON.stringify(p.specs?.[f.key] ?? null));
          return new Set(vals).size > 1;
        }),
      }))
      .filter((g) => g.fields.length > 0);
  }, [onlyDiff, def, products]);

  return (
    // LayoutGroup scopes the shared layoutId animations (category pill,
    // slot image swap) to this component only.
    <LayoutGroup>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-zinc-200/70 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:shadow-none p-6 sm:p-8"
      >
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Compare Gadgets
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Pick two or more gadgets to see them side by side.
          </p>
        </div>

        {/* ── Category tabs ──────────────────────────────────────
            Active tab gets a sliding pill background, same pattern
            as the nav-link pill in Navbar.tsx (layoutId animation). */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 border-b border-zinc-200 dark:border-zinc-800">
          {categories.map((c) => {
            const active = c.slug === category;
            return (
              <button
                key={c.slug}
                onClick={() => handleCategoryChange(c.slug)}
                className="relative shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="compare-category-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-blue-600"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className={active ? "text-white" : "text-zinc-500 dark:text-zinc-400"}>
                  {c.icon && <img src={c.icon} alt="" className="inline h-4 w-4 mr-1 align-[-2px]" />}
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Product slots ───────────────────────────────────────
            One card per comparison slot. AnimatePresence + a key on
            the product slug lets the image/name cross-fade smoothly
            whenever a slot's selection changes. */}
        <div
          className="grid gap-4 mb-6"
          style={{ gridTemplateColumns: `repeat(${maxSlots}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: maxSlots }).map((_, i) => {
            const current = products[i];
            return (
              <motion.div
                key={i}
                whileHover={{ y: -2 }}
                className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 text-center overflow-hidden"
              >
                <AnimatePresence mode="wait">
                  {current ? (
                    <motion.div
                      key={current.slug}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.25 }}
                    >
                      {current.image && (
                        <img
                          src={current.image}
                          alt={current.name}
                          className="h-16 mx-auto object-contain mb-2"
                        />
                      )}
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                        {current.name}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-6"
                    >
                      <p className="text-sm text-zinc-400">Add product</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <select
                  className="mt-3 w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md p-1.5"
                  value={current?.slug ?? ""}
                  onChange={(e) => handlePick(i, e.target.value)}
                >
                  <option value="">Select product...</option>
                  {categoryProducts.map((p) => (
                    <option key={p.slug} value={p.slug}>{p.brand} {p.name}</option>
                  ))}
                </select>
              </motion.div>
            );
          })}
        </div>

        {/* Loading indicator — small animated dots instead of static text */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-sm text-zinc-400 mb-4"
            >
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                    className="h-1.5 w-1.5 rounded-full bg-zinc-400"
                  />
                ))}
              </span>
              Loading
            </motion.div>
          )}
        </AnimatePresence>

        {def && products.length >= 2 ? (
          <>
            {/* Diff toggles */}
            <div className="flex gap-6 justify-end mb-4">
              <ToggleSwitch checked={highlightDiff} onChange={setHighlightDiff} label="Highlight Differences" />
              <ToggleSwitch checked={onlyDiff} onChange={setOnlyDiff} label="Show only Differences" />
            </div>

            {/* Jump nav — quick links to each spec group */}
            <nav className="flex gap-2 overflow-x-auto text-sm mb-4">
              {groups.map((g) => (
                <a
                  key={g.title}
                  href={`#${g.title.toLowerCase()}`}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-zinc-700 transition-colors"
                >
                  {g.title}
                </a>
              ))}
            </nav>

            {/* ── Spec comparison table ─────────────────────────
                Rows animate in with a stagger, and re-animate when
                `onlyDiff` changes which rows are visible. */}
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <AnimatePresence initial={false}>
                    {groups.map((g) => (
                      <React.Fragment key={g.title}>
                        <tr id={g.title.toLowerCase()} className="bg-zinc-50 dark:bg-zinc-800">
                          <td colSpan={products.length + 1} className="font-semibold p-3 text-zinc-700 dark:text-zinc-200">
                            {g.title}
                          </td>
                        </tr>
                        {g.fields.map((f) => {
                          const vals = products.map((p) => p.specs?.[f.key]);
                          const differs = new Set(vals.map((v) => JSON.stringify(v))).size > 1;
                          return (
                            <motion.tr
                              key={f.key}
                              layout
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-b border-zinc-100 dark:border-zinc-800"
                            >
                              <td className="p-3 font-medium text-zinc-500 dark:text-zinc-400">{f.label}</td>
                              {vals.map((v, i) => (
                                <td
                                  key={i}
                                  className={`p-3 whitespace-pre-line text-zinc-800 dark:text-zinc-100 transition-colors duration-300 ${
                                    highlightDiff && differs ? "bg-yellow-50 dark:bg-yellow-900/20" : ""
                                  }`}
                                >
                                  {v === undefined || v === null || v === "" ? "—" : String(v)}
                                </td>
                              ))}
                            </motion.tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-zinc-400 py-10"
          >
            Pick at least 2 {def?.name.toLowerCase()} to compare.
          </motion.p>
        )}
      </motion.div>
    </LayoutGroup>
  );
}