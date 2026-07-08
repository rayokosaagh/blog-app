// src/components/GadgetCompareClient.tsx
"use client";

import React, { useState, useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { GadgetCategoryDef, SpecField } from "@/lib/gadgets/types";

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
// Renders as a self-contained "chip" that tints on activation,
// rather than a bare switch + label, for a more contemporary feel.
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
    <motion.button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      whileTap={{ scale: 0.96 }}
      className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-medium transition-colors duration-300 ease-out ${
        checked
          ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      }`}
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-300 ease-out ${
          checked
            ? "bg-blue-600 shadow-[0_0_0_1px_rgba(37,99,235,0.35),0_1px_4px_rgba(37,99,235,0.4)]"
            : "bg-zinc-300 dark:bg-zinc-600"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 600, damping: 32 }}
          className="h-3.5 w-3.5 rounded-full bg-white shadow-sm"
          style={{ marginLeft: checked ? "18px" : "3px" }}
        />
      </span>
      {label}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────
// Search box for a single comparison slot. Filters the already
// fetched `options` list client-side (so thumbnails are free —
// no extra network round trip), shows a dropdown with images,
// and calls onPick(slug) when a result is clicked.
// ─────────────────────────────────────────────────────────────
export interface ProductSearchBoxHandle {
  focus: () => void;
}

const ProductSearchBox = forwardRef<
  ProductSearchBoxHandle,
  {
    options: ProductLite[];
    onPick: (slug: string) => void;
    placeholder: string;
  }
>(function ProductSearchBox({ options, onPick, placeholder }, ref) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      setOpen(true);
      inputRef.current?.focus();
    },
  }));

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
    <div ref={wrapRef} className="relative z-30 mt-3">
      <input
        ref={inputRef}
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
            No products match "{query}".
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

function ChevronIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.2 }}
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
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

  // ── Filtering state ─────────────────────────────────────────
  const [fieldFilter, setFieldFilter] = useState("");
  const [openMobileGroups, setOpenMobileGroups] = useState<Set<string>>(new Set());
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [activeGroupTitle, setActiveGroupTitle] = useState<string | null>(null);

  const maxSlots = def?.maxCompare ?? 3;

  const [slots, setSlots] = useState<(Product | null)[]>(() => {
    const arr: (Product | null)[] = new Array(maxSlots).fill(null);
    initialProducts.slice(0, maxSlots).forEach((p, i) => (arr[i] = p));
    return arr;
  });

  const requestIdRef = useRef(0);
  const searchBoxRefs = useRef<Array<ProductSearchBoxHandle | null>>([]);

  // Tracks the live height of the sticky header (tabs + slots + controls
  // + jump nav). Used so anchor jumps land BELOW the sticky bar instead
  // of being hidden underneath it, and recalculates whenever the header's
  // content changes size (e.g. controls/nav appearing once 2+ products
  // are picked).
  const stickyHeaderRef = useRef<HTMLDivElement>(null);
  const [headerOffset, setHeaderOffset] = useState(0);

  useEffect(() => {
    const el = stickyHeaderRef.current;
    if (!el) return;
    const update = () => setHeaderOffset(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
      if (reqId !== requestIdRef.current) return;
      const nextDef: GadgetCategoryDef | undefined = data.categoryDef;
      const nextMaxSlots = nextDef?.maxCompare ?? 3;
      setCategoryProducts(data.products ?? []);
      setDef(nextDef);
      setSlots(new Array(nextMaxSlots).fill(null));
      setFieldFilter("");
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }

  async function handlePick(slotIndex: number, productSlug: string) {
    if (!productSlug) {
      handleRemove(slotIndex);
      return;
    }
    // A product already sitting in another slot can't be picked again —
    // the dropdown already filters these out, but this guard covers any
    // other path that might call handlePick (e.g. programmatic calls).
    const alreadyUsedElsewhere = slots.some((s, i) => i !== slotIndex && s?.slug === productSlug);
    if (alreadyUsedElsewhere) return;

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
          console.warn("Some products could not be loaded:", data.missingSlugs);
        }

        setSlots((prev) => {
          const updated = [...prev];
          if (bySlug[productSlug]) {
            updated[slotIndex] = bySlug[productSlug];
          }
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

  function toggleMobileGroup(title: string) {
    setOpenMobileGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  // Clicking a spec row "zooms" into it: dims every other row and pops
  // a large-format comparison bar above the table. Clicking the same
  // row (or its close button) clears the focus.
  function toggleFocus(key: string) {
    setFocusedKey((prev) => (prev === key ? null : key));
  }

  // Focus persists across the (unfiltered) group list so a filter typed
  // afterward doesn't silently drop the field you're focused on.
  const focusedField: SpecField | undefined = useMemo(() => {
    if (!focusedKey || !def) return undefined;
    for (const g of def.groups) {
      const f = g.fields.find((f) => f.key === focusedKey);
      if (f) return f;
    }
    return undefined;
  }, [focusedKey, def]);

  const filledProducts = useMemo(() => slots.filter(Boolean) as Product[], [slots]);

  // Slugs already occupying a slot — used to hide those products from
  // every OTHER slot's search dropdown so the same product can't be
  // selected twice.
  const usedSlugs = useMemo(
    () => new Set(slots.map((s) => s?.slug).filter(Boolean) as string[]),
    [slots]
  );

  // Spec groups shown in the table — filtered by "only differences"
  // and by the free-text field-label search.
  const groups = useMemo(() => {
    if (!def) return [];
    const q = fieldFilter.trim().toLowerCase();
    return def.groups
      .map((g) => ({
        ...g,
        fields: g.fields.filter((f) => {
          if (q && !f.label.toLowerCase().includes(q) && !g.title.toLowerCase().includes(q)) return false;
          if (onlyDiff) {
            const vals = filledProducts.map((p) => JSON.stringify(p.specs?.[f.key] ?? null));
            return new Set(vals).size > 1;
          }
          return true;
        }),
      }))
      .filter((g) => g.fields.length > 0);
  }, [onlyDiff, def, filledProducts, fieldFilter]);

  return (
    <LayoutGroup>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl border border-zinc-200/70 dark:border-white/10 bg-gradient-to-b from-white/90 to-white/70 dark:from-white/[0.04] dark:to-white/[0.02] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:shadow-none p-4 sm:p-8"
      >
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Compare Gadgets
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Pick two or more gadgets to see them side by side.
          </p>
        </div>

        {/* ── Sticky compare header: category tabs, product cards,
             filter/sort controls — stays visible while scrolling
             through a long spec table below. Adjust `top-0` to e.g.
             `top-16` if your site has a fixed navbar overlapping it. ── */}
        <div
          ref={stickyHeaderRef}
          className="sticky top-0 z-20 -mx-4 sm:-mx-8 px-4 sm:px-8 pt-1 pb-2 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md"
        >
          {/* ── Category selector: segmented control ─────────────── */}
          <div className="mb-6 flex overflow-x-auto">
            <div className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-zinc-200/60 bg-zinc-100/80 p-1 backdrop-blur-sm dark:border-white/5 dark:bg-zinc-800/60">
              {categories.map((c) => {
                const active = c.slug === category;
                return (
                  <motion.button
                    key={c.slug}
                    onClick={() => handleCategoryChange(c.slug)}
                    whileTap={{ scale: 0.96 }}
                    whileHover={active ? undefined : { scale: 1.02 }}
                    aria-pressed={active}
                    className="relative shrink-0 rounded-xl px-4 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  >
                    {active && (
                      <motion.span
                        layoutId="compare-category-pill"
                        className="absolute inset-0 rounded-xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)] ring-1 ring-black/5 dark:bg-zinc-900 dark:shadow-[0_2px_10px_rgba(0,0,0,0.45)] dark:ring-white/10"
                        transition={{ type: "spring", stiffness: 450, damping: 34 }}
                      />
                    )}
                    <span
                      className={`relative z-10 flex items-center gap-1.5 transition-colors duration-200 ${
                        active
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                      }`}
                    >
                      {c.icon && <i className={`${c.icon} text-base`} aria-hidden="true" />}
                      {c.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

        {/* ── Product slots ─────────────────────────────────────── */}
        <motion.div
          variants={slotContainerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 flex items-stretch gap-2 sm:gap-4 mb-6"
        >
          {Array.from({ length: maxSlots }).map((_, i) => {
            const current = slots[i];
            return (
              <React.Fragment key={i}>
                <motion.div
                  layout
                  variants={slotCardVariants}
                  whileHover={{ y: -4, scale: 1.015, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ layout: { type: "spring", stiffness: 300, damping: 28 } }}
                  onClick={current ? undefined : () => searchBoxRefs.current[i]?.focus()}
                  className={`relative flex-1 min-w-0 rounded-2xl border p-3 sm:p-4 text-center transition-colors ${
                    current
                      ? "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60"
                      : "border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900/30 hover:border-blue-300 dark:hover:border-blue-500/50 cursor-pointer"
                  }`}
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
                          className="h-14 sm:h-16 mx-auto object-contain mb-2"
                        />
                      )}
                      <p className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                        {current.name}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-4"
                    >
                      <motion.button
                        type="button"
                        onClick={() => searchBoxRefs.current[i]?.focus()}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.92 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        aria-label="Add a product to this slot"
                        className="mx-auto mb-2 h-10 w-10 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </motion.button>
                      <p className="text-xs sm:text-sm text-zinc-400">Add product</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <ProductSearchBox
                  ref={(el) => (searchBoxRefs.current[i] = el)}
                  options={categoryProducts.filter(
                    (p) => p.slug === current?.slug || !usedSlugs.has(p.slug)
                  )}
                  onPick={(slug) => handlePick(i, slug)}
                  placeholder="Search product..."
                />
                </motion.div>

                {i < maxSlots - 1 && (
                  <AnimatePresence>
                    {slots[i] && slots[i + 1] && (
                      <motion.div
                        key="vs"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ type: "spring", stiffness: 400, damping: 24 }}
                        className="flex items-center justify-center shrink-0"
                      >
                        <span className="flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] sm:text-xs font-bold tracking-wide text-zinc-400 dark:text-zinc-500">
                          VS
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </React.Fragment>
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

          {/* ── Controls: filter, sort, diff toggles ─────────── */}
          {def && filledProducts.length >= 2 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="relative flex-1 min-w-0">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  value={fieldFilter}
                  onChange={(e) => setFieldFilter(e.target.value)}
                  placeholder="Filter specs (e.g. battery, RAM)..."
                  className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="flex gap-4 sm:gap-6 shrink-0">
                <ToggleSwitch checked={highlightDiff} onChange={setHighlightDiff} label="Highlight" />
                <ToggleSwitch checked={onlyDiff} onChange={setOnlyDiff} label="Diffs only" />
              </div>
            </div>
          )}

          {/* ── Jump nav — lives inside the sticky header now, so it
               stays visible (and clickable) while you scroll through
               a long spec table instead of scrolling away with it ── */}
          {def && filledProducts.length >= 2 && groups.length > 0 && (
            <nav className="hidden sm:flex gap-2 overflow-x-auto text-sm pt-3">
              {groups.map((g) => {
                const isActiveTag = activeGroupTitle === g.title;
                return (
                  <motion.a
                    key={g.title}
                    href={`#${g.title.toLowerCase()}`}
                    onClick={() => setActiveGroupTitle(g.title)}
                    whileHover={{ scale: 1.06, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${
                      isActiveTag
                        ? "bg-blue-600 text-white shadow-[0_2px_10px_rgba(37,99,235,0.35)] dark:bg-blue-500"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {g.title}
                  </motion.a>
                );
              })}
            </nav>
          )}

          {/* ── Focused spec bar — zoomed view of one clicked row.
               Lives inside the sticky header (like the jump nav above
               it) so it stays pinned on screen instead of scrolling
               away once you dismiss/reopen it partway down the table. ── */}
          <AnimatePresence>
            {focusedField && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/60 dark:bg-blue-500/10 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                      Focused spec{focusedField.unit ? ` · ${focusedField.unit}` : ""}
                    </p>
                    <button
                      type="button"
                      onClick={() => setFocusedKey(null)}
                      className="h-6 w-6 flex items-center justify-center rounded-full bg-white/80 dark:bg-zinc-800 text-zinc-500 hover:text-red-500 text-sm leading-none"
                      aria-label="Clear focused spec"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-3">{focusedField.label}</p>
                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: `repeat(${filledProducts.length}, minmax(0,1fr))` }}
                  >
                    {filledProducts.map((p) => {
                      const v = p.specs?.[focusedField.key];
                      return (
                        <motion.div
                          key={p.id}
                          layout
                          className="rounded-xl p-3 text-center border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                        >
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mb-1">{p.name}</p>
                          <p className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                            {v === undefined || v === null || v === "" ? "—" : String(v)}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* ── /Sticky compare header ──────────────────────────────── */}

        {def && filledProducts.length >= 2 ? (
          <>
            {groups.length === 0 ? (
              <p className="text-center text-zinc-400 py-10 text-sm">
                No specs match "{fieldFilter}".
              </p>
            ) : (
              <>
                {/* ── Desktop/tablet: grouped comparison table ──── */}
                <div className="hidden sm:block relative z-0 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-zinc-50/80 dark:bg-zinc-800/80 backdrop-blur">
                        <th className="sticky left-0 bg-zinc-50/80 dark:bg-zinc-800/80 backdrop-blur p-3 text-left font-semibold text-zinc-500 dark:text-zinc-400 z-10">
                          Spec
                        </th>
                        {filledProducts.map((p) => (
                          <th key={p.id} className="p-3 text-left font-semibold text-zinc-700 dark:text-zinc-200 truncate max-w-[160px]">
                            {p.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
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
                              style={{ scrollMarginTop: headerOffset + 12 }}
                              className={`transition-colors duration-300 ${
                                activeGroupTitle === g.title
                                  ? "bg-blue-50 dark:bg-blue-500/10"
                                  : "bg-zinc-50 dark:bg-zinc-800"
                              }`}
                            >
                              <td
                                colSpan={filledProducts.length + 1}
                                className={`font-semibold p-3 border-l-2 ${
                                  activeGroupTitle === g.title
                                    ? "border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300"
                                    : "border-transparent text-zinc-700 dark:text-zinc-200"
                                }`}
                              >
                                {g.title}
                              </td>
                            </motion.tr>
                            {g.fields.map((f) => {
                              const vals = filledProducts.map((p) => p.specs?.[f.key]);
                              const differs = new Set(vals.map((v) => JSON.stringify(v))).size > 1;
                              const isFocused = focusedKey === f.key;
                              const isDimmed = focusedKey !== null && !isFocused;
                              return (
                                <motion.tr
                                  key={f.key}
                                  layout
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: isDimmed ? 0.35 : 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  onClick={() => toggleFocus(f.key)}
                                  className={`border-b border-zinc-100 dark:border-zinc-800 cursor-pointer transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-500/5 ${
                                    isFocused ? "ring-1 ring-inset ring-blue-400 bg-blue-50/70 dark:bg-blue-500/10" : ""
                                  }`}
                                >
                                  <td className={`sticky left-0 p-3 font-medium text-zinc-500 dark:text-zinc-400 ${isFocused ? "bg-blue-50/70 dark:bg-blue-500/10" : "bg-white dark:bg-zinc-900"}`}>
                                    {f.label}
                                    {f.unit ? <span className="text-zinc-300 dark:text-zinc-600"> ({f.unit})</span> : null}
                                  </td>
                                  {filledProducts.map((p, i) => {
                                    const v = vals[i];
                                    return (
                                      <td key={p.id} className="p-3 whitespace-pre-line">
                                        <span
                                          className={`inline-flex items-center rounded-md transition-colors duration-300 ease-out ${
                                            highlightDiff && differs
                                              ? "pl-2.5 pr-2.5 py-1 -ml-px border-l-2 border-amber-500 dark:border-amber-400 bg-amber-500/[0.07] dark:bg-amber-400/[0.09] text-amber-950 dark:text-amber-100 font-semibold"
                                              : "text-zinc-800 dark:text-zinc-100"
                                          }`}
                                        >
                                          {v === undefined || v === null || v === "" ? "—" : String(v)}
                                        </span>
                                      </td>
                                    );
                                  })}
                                </motion.tr>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* ── Mobile: stacked per-product cards ──────────── */}
                <div className="sm:hidden space-y-3">
                  {groups.map((g) => {
                    const isOpen = openMobileGroups.has(g.title) || fieldFilter.length > 0;
                    return (
                      <div key={g.title} className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => {
                            toggleMobileGroup(g.title);
                            setActiveGroupTitle(g.title);
                          }}
                          className={`w-full flex items-center justify-between p-3 text-left border-l-2 transition-colors ${
                            activeGroupTitle === g.title
                              ? "bg-blue-50 dark:bg-blue-500/10 border-blue-500 dark:border-blue-400"
                              : "bg-zinc-50 dark:bg-zinc-800 border-transparent"
                          }`}
                        >
                          <span className={`font-semibold text-sm ${activeGroupTitle === g.title ? "text-blue-700 dark:text-blue-300" : "text-zinc-700 dark:text-zinc-200"}`}>{g.title}</span>
                          <ChevronIcon open={isOpen} className="h-4 w-4 text-zinc-400" />
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              {g.fields.map((f) => {
                                const isFocused = focusedKey === f.key;
                                const fieldVals = filledProducts.map((p) => JSON.stringify(p.specs?.[f.key] ?? null));
                                const fieldDiffers = new Set(fieldVals).size > 1;
                                return (
                                  <div
                                    key={f.key}
                                    onClick={() => toggleFocus(f.key)}
                                    className={`p-3 border-t border-zinc-100 dark:border-zinc-800 cursor-pointer ${
                                      isFocused ? "bg-blue-50/70 dark:bg-blue-500/10" : ""
                                    }`}
                                  >
                                    <p className="text-xs font-medium text-zinc-400 mb-1.5">
                                      {f.label}{f.unit ? ` (${f.unit})` : ""}
                                    </p>
                                    <div className="space-y-1.5">
                                      {filledProducts.map((p) => {
                                        const v = p.specs?.[f.key];
                                        return (
                                          <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                                            <span className="text-zinc-500 dark:text-zinc-400 truncate">{p.name}</span>
                                            <span
                                              className={`inline-flex items-center rounded-md transition-colors duration-300 ease-out ${
                                                highlightDiff && fieldDiffers
                                                  ? "pl-2.5 pr-2.5 py-1 -mr-px border-r-2 border-amber-500 dark:border-amber-400 bg-amber-500/[0.07] dark:bg-amber-400/[0.09] text-amber-950 dark:text-amber-100 font-semibold"
                                                  : "text-zinc-800 dark:text-zinc-100"
                                              }`}
                                            >
                                              {v === undefined || v === null || v === "" ? "—" : String(v)}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
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