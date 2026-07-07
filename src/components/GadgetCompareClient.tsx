// src/components/GadgetCompareClient.tsx
"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { GadgetCategoryDef } from "@/lib/gadgets/types";

const slotContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const slotCardVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

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

// ─────────────────────────────────────────────────────────────
// Search box for a single comparison slot. Filters the already
// fetched `options` list client-side (so thumbnails are free —
// no extra network round trip), shows a dropdown with images,
// and calls onPick(slug) when a result is clicked.
// ─────────────────────────────────────────────────────────────
function ProductSearchBox({
  options,
  onPick,
  placeholder,
}: {
  options: ProductLite[];
  onPick: (slug: string) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? options.filter(
          (p) =>
            p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
        )
      : options;
    return list.slice(0, 8);
  }, [query, options]);

  return (
    // z-30 + relative so this wins the stacking fight against the spec
    // table (which sits underneath in normal document flow) and against
    // sibling slot cards' own content.
    <div ref={wrapRef} className="relative z-30 mt-3">
      <input
        type="text"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md p-1.5 outline-none focus:ring-2 focus:ring-blue-500/40"
      />
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg text-left"
          >
            {results.map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(p.slug);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs"
                >
                  {p.image ? (
                    <img
                      src={p.image}
                      alt=""
                      className="h-7 w-7 object-contain rounded bg-zinc-50 dark:bg-zinc-800 shrink-0"
                    />
                  ) : (
                    <span className="h-7 w-7 rounded bg-zinc-100 dark:bg-zinc-800 shrink-0" />
                  )}
                  <span className="truncate text-zinc-800 dark:text-zinc-100">
                    {p.brand} {p.name}
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
        {open && query && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute z-30 mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg text-xs text-zinc-400 p-2"
          >
            No products match “{query}”.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
  const [loading, setLoading] = useState(false);
  const [highlightDiff, setHighlightDiff] = useState(true);
  const [onlyDiff, setOnlyDiff] = useState(false);

  const maxSlots = def?.maxCompare ?? 3;

  // `slots` is a FIXED-LENGTH array, one entry per comparison slot.
  // This is the key fix: a product picked into slot 2 stays in
  // index 2, instead of being compacted to index 0 like before.
  const [slots, setSlots] = useState<(Product | null)[]>(() => {
    const arr: (Product | null)[] = new Array(maxSlots).fill(null);
    initialProducts.slice(0, maxSlots).forEach((p, i) => (arr[i] = p));
    return arr;
  });

  // Guards against out-of-order responses when someone switches
  // categories back and forth quickly (phone -> laptop -> phone).
  const requestIdRef = useRef(0);

  // Keep the URL in sync with the current selection so a page refresh
  // reflects what's actually on screen — not whatever slugs the user
  // originally landed with. Uses replaceState (not router.replace) so
  // this never triggers a server re-render/navigation, just updates
  // the address bar for correctness on manual refresh/copy-link.
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("category", category);
    slots.forEach((s, i) => {
      if (s) params.set(`p${i + 1}`, s.slug);
    });
    const query = params.toString();
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [category, slots]);

  async function handleCategoryChange(slug: string) {
    const reqId = ++requestIdRef.current;
    setCategory(slug);
    setLoading(true);
    try {
      const res = await fetch(`/api/gadgets/products?category=${slug}`);
      const data = await res.json();
      if (reqId !== requestIdRef.current) return; // a newer switch happened, ignore this response
      const nextDef: GadgetCategoryDef | undefined = data.categoryDef;
      const nextMaxSlots = nextDef?.maxCompare ?? 3;
      setCategoryProducts(data.products ?? []);
      setDef(nextDef);
      setSlots(new Array(nextMaxSlots).fill(null));
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }

  // Pick a product into a specific slot. Always writes to `slotIndex`
  // directly, and matches the API response back to slots by slug —
  // never by array position — so nothing shifts around.
  async function handlePick(slotIndex: number, productSlug: string) {
    if (!productSlug) {
      handleRemove(slotIndex);
      return;
    }
    const reqId = ++requestIdRef.current;
    setLoading(true);
    try {
      const slugsInSlotOrder = slots.map((s) => s?.slug ?? null);
      slugsInSlotOrder[slotIndex] = productSlug;
      const slugs = slugsInSlotOrder.filter(Boolean) as string[];

      const params = new URLSearchParams({ category });
      slugs.forEach((s, i) => params.set(`p${i + 1}`, s));

      const res = await fetch(`/api/gadgets/compare?${params.toString()}`);
      const data = await res.json();
      if (reqId !== requestIdRef.current) return;

      if (res.ok) {
        const bySlug: Record<string, Product> = {};
        (data.products as Product[]).forEach((p) => (bySlug[p.slug] = p));

        if (data.missingSlugs?.length) {
          // Server resolved the request but couldn't find every slug
          // (stale pick, deleted product, category mismatch, etc).
          // Log it rather than silently discarding the whole update.
          console.warn("Some products could not be loaded:", data.missingSlugs);
        }

        setSlots((prev) => {
          const updated = [...prev];
          // Only overwrite the slot we just picked if the server actually
          // returned data for it — otherwise leave the previous value in
          // place instead of nulling it out from under the user.
          if (bySlug[productSlug]) {
            updated[slotIndex] = bySlug[productSlug];
          }
          // Refresh any other already-filled slots with the latest data too.
          return updated.map((s) => (s && bySlug[s.slug] ? bySlug[s.slug] : s));
        });
      }
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }

  function handleRemove(slotIndex: number) {
    setSlots((prev) => {
      const updated = [...prev];
      updated[slotIndex] = null;
      return updated;
    });
  }

  const filledProducts = useMemo(() => slots.filter(Boolean) as Product[], [slots]);

  // Spec groups shown in the table — filtered down to only-differing
  // fields when the "Show only Differences" toggle is on.
  const groups = useMemo(() => {
    if (!def) return [];
    if (!onlyDiff) return def.groups;
    return def.groups
      .map((g) => ({
        ...g,
        fields: g.fields.filter((f) => {
          const vals = filledProducts.map((p) => JSON.stringify(p.specs?.[f.key] ?? null));
          return new Set(vals).size > 1;
        }),
      }))
      .filter((g) => g.fields.length > 0);
  }, [onlyDiff, def, filledProducts]);

  return (
    <LayoutGroup>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl border border-zinc-200/70 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:shadow-none p-6 sm:p-8"
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

        {/* ── Category tabs ────────────────────────────────────── */}
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
  {c.icon && <i className={`${c.icon} mr-1.5 align-[-1px]`} aria-hidden="true" />}
  {c.name}
</span>
              </button>
            );
          })}
        </div>

        {/* ── Product slots ─────────────────────────────────────── */}
        {/*
          NOTE: removed `overflow-hidden` here. It was clipping the
          ProductSearchBox dropdown (which is position:absolute and
          renders below the card's own bounds), no matter what z-index
          the dropdown had — an overflow:hidden ancestor always wins
          over z-index for content that visually extends past it.
          `relative z-10` keeps this whole row above the spec table
          that follows it later in the DOM.
        */}
        <motion.div
  variants={slotContainerVariants}
  initial="hidden"
  animate="show"
  className="relative z-10 grid gap-4 mb-6"
  style={{ gridTemplateColumns: `repeat(${maxSlots}, minmax(0, 1fr))` }}
>
  {Array.from({ length: maxSlots }).map((_, i) => {
    const current = slots[i];
    return (
      <motion.div
        key={i}
        layout
        variants={slotCardVariants}
        whileHover={{ y: -4, scale: 1.015, transition: { type: "spring", stiffness: 300, damping: 20 } }}
        whileTap={{ scale: 0.98 }}
        transition={{ layout: { type: "spring", stiffness: 300, damping: 28 } }}
        className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 text-center"
      >
                <AnimatePresence>
  {current && (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      whileHover={{ scale: 1.15, rotate: 90 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => handleRemove(i)}
      aria-label={`Remove ${current.name} from comparison`}
      className="absolute top-2 right-2 h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 flex items-center justify-center text-sm leading-none"
    >
      ×
    </motion.button>
  )}
</AnimatePresence>

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
  <motion.img
    layout
    src={current.image}
    alt={current.name}
    initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
    animate={{ opacity: 1, scale: 1, rotate: 0 }}
    transition={{ type: "spring", stiffness: 260, damping: 20 }}
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

                <ProductSearchBox
                  options={categoryProducts}
                  onPick={(slug) => handlePick(i, slug)}
                  placeholder="Search product..."
                />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Loading indicator */}
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

        {def && filledProducts.length >= 2 ? (
          <>
            {/* Diff toggles */}
            <div className="flex gap-6 justify-end mb-4">
              <ToggleSwitch checked={highlightDiff} onChange={setHighlightDiff} label="Highlight Differences" />
              <ToggleSwitch checked={onlyDiff} onChange={setOnlyDiff} label="Show only Differences" />
            </div>

            {/* Jump nav */}
            <nav className="flex gap-2 overflow-x-auto text-sm mb-4">
              {groups.map((g) => (
                <motion.a
  key={g.title}
  href={`#${g.title.toLowerCase()}`}
  whileHover={{ scale: 1.06, y: -1 }}
  whileTap={{ scale: 0.96 }}
  className="whitespace-nowrap px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-zinc-700 transition-colors"
>
  {g.title}
</motion.a>
              ))}
            </nav>

            {/* ── Spec comparison table ───────────────────────── */}
            <div className="relative z-0 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <AnimatePresence initial={false}>
                    {groups.map((g) => (
                      <React.Fragment key={g.title}>
                        <motion.tr
  layout
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
  id={g.title.toLowerCase()}
  className="bg-zinc-50 dark:bg-zinc-800"
>
  <td colSpan={filledProducts.length + 1} className="font-semibold p-3 text-zinc-700 dark:text-zinc-200">
    {g.title}
  </td>
</motion.tr>
                        {g.fields.map((f) => {
                          const vals = filledProducts.map((p) => p.specs?.[f.key]);
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
                                  className={`p-3 whitespace-pre-line text-zinc-800 dark:text-zinc-100 transition-colors duration-500 ease-out ${
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