// src/components/GadgetCompareClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { GadgetCategoryDef, SpecField } from "@/lib/gadgets/types";

import { CategoryOption, Product, ProductLite } from "./compare/types";
import CategorySelector from "./compare/CategorySelector";
import ProductSlots from "./compare/ProductSlots";
import ControlsBar from "./compare/ControlsBar";
import JumpNav from "./compare/JumpNav";
import FocusedSpecBar from "./compare/FocusedSpecBar";
import DesktopTable from "./compare/DesktopTable";
import MobileTable from "./compare/MobileTable";
import ComparisonVerdict, { type EditorVerdict } from "./compare/ComparisonVerdict";
import { visibleFieldsAcross } from "@/lib/gadgets/formatSpecValue";

interface GadgetCompareClientProps {
  categories: CategoryOption[];
  initialCategory: string;
  initialCategoryProducts: ProductLite[];
  initialProducts: Product[];
  initialDef?: GadgetCategoryDef;
  /** Editor-written summary for the initial pair, by product slug. */
  initialEditorVerdicts?: EditorVerdict;
}

export default function GadgetCompareClient({
  categories,
  initialCategory,
  initialCategoryProducts,
  initialProducts,
  initialDef,
  initialEditorVerdicts,
}: GadgetCompareClientProps) {
  const [category, setCategory] = useState(initialCategory);
  const [def, setDef] = useState<GadgetCategoryDef | undefined>(initialDef);
  const [categoryProducts, setCategoryProducts] = useState<ProductLite[]>(initialCategoryProducts);
  const [loading, setLoading] = useState(false);
  const [highlightDiff, setHighlightDiff] = useState(true);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [editorVerdicts, setEditorVerdicts] = useState<EditorVerdict>(
    initialEditorVerdicts ?? {}
  );

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

        // Empty for any pairing an editor hasn't written copy for, which is
        // most of them — the summary card then renders nothing at all.
        setEditorVerdicts(data.editorVerdicts ?? {});
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
    // The remaining products are a different comparison, so copy written for
    // the old pair no longer applies. Cleared rather than refetched: the next
    // pick re-requests it anyway.
    setEditorVerdicts({});
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

  function getVisibleGroupElement(title: string): HTMLElement | null {
  const id = title.toLowerCase();
  const desktopEl = document.getElementById(id);
  if (desktopEl && desktopEl.offsetParent !== null) return desktopEl;
  const mobileEl = document.getElementById(`m-${id}`);
  if (mobileEl && mobileEl.offsetParent !== null) return mobileEl;
  return null;
}

function jumpToGroup(title: string) {
  setActiveGroupTitle(title);
  const el = getVisibleGroupElement(title);
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - (headerOffset + 12);
    window.scrollTo({ top: y, behavior: "smooth" });
  }
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
    const specsList = filledProducts.map((p) => p.specs ?? {});
    return def.groups
      .map((g) => ({
        ...g,
        // Rows nobody on screen has a value for are dropped first — a table of
        // dashes says nothing. A row only one product fills is kept: that gap
        // is the comparison.
        fields: visibleFieldsAcross(g, specsList).filter((f) => {
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

  useEffect(() => {
  if (groups.length === 0) return;

  const ids = groups.map((g) => g.title.toLowerCase());

function updateActiveGroup() {
  const triggerLine = headerOffset + 24;
  let current: string | null = null;

  for (const id of ids) {
    const el = getVisibleGroupElement(id); // id here is already lowercase title
    if (!el) continue;
    const top = el.getBoundingClientRect().top;
    if (top <= triggerLine) {
      current = id;
    } else {
      break;
    }
  }

  if (!current) current = ids[0];
  const match = groups.find((g) => g.title.toLowerCase() === current);
  if (match) setActiveGroupTitle((prev) => (prev === match.title ? prev : match.title));
}

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateActiveGroup();
      ticking = false;
    });
  }

  updateActiveGroup();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
}, [groups, headerOffset]);

  const showComparison = !!def && filledProducts.length >= 2;

  return (
    <LayoutGroup>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-none border-2 border-border-heavy bg-card shadow-brutal-lg p-4 sm:p-8"
      >
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Compare Gadgets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pick two or more gadgets to see them side by side.
          </p>
        </div>

        {/* ── Sticky compare header: category tabs, product cards,
             filter/sort controls — stays visible while scrolling
             through a long spec table below. Adjust `top-0` to e.g.
             `top-16` if your site has a fixed navbar overlapping it. ── */}
        <div
          ref={stickyHeaderRef}
          className="sticky top-0 z-20 -mx-4 sm:-mx-8 px-4 sm:px-8 pt-1 pb-2 bg-background"
        >
          <CategorySelector categories={categories} category={category} onChange={handleCategoryChange} />

          <ProductSlots
            maxSlots={maxSlots}
            slots={slots}
            categoryProducts={categoryProducts}
            usedSlugs={usedSlugs}
            onPick={handlePick}
            onRemove={handleRemove}
          />

          {loading && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear", delay: i * 0.15 }}
                    className="h-1.5 w-1.5 rounded-none bg-muted-foreground"
                  />
                ))}
              </span>
              Loading
            </div>
          )}

          {showComparison && (
            <ControlsBar
              fieldFilter={fieldFilter}
              onFieldFilterChange={setFieldFilter}
              highlightDiff={highlightDiff}
              onHighlightDiffChange={setHighlightDiff}
              onlyDiff={onlyDiff}
              onOnlyDiffChange={setOnlyDiff}
            />
          )}

          {showComparison && <JumpNav groups={groups} activeGroupTitle={activeGroupTitle} onJump={jumpToGroup} />}

          <FocusedSpecBar
            focusedField={focusedField}
            focusedKey={focusedKey}
            filledProducts={filledProducts}
            onClear={() => setFocusedKey(null)}
          />
        </div>
        {/* ── /Sticky compare header ──────────────────────────────── */}

        {showComparison ? (
          groups.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 text-sm">
              No specs match "{fieldFilter}".
            </p>
          ) : (
            <>
              {/* Renders nothing unless an editor wrote a summary for this
                  exact pair, which most pairings won't have. */}
              <ComparisonVerdict products={filledProducts} editorVerdicts={editorVerdicts} />
              <DesktopTable
                groups={groups}
                filledProducts={filledProducts}
                activeGroupTitle={activeGroupTitle}
                focusedKey={focusedKey}
                headerOffset={headerOffset}
                highlightDiff={highlightDiff}
                onToggleFocus={toggleFocus}
              />
              <MobileTable
  groups={groups}
  filledProducts={filledProducts}
  activeGroupTitle={activeGroupTitle}
  focusedKey={focusedKey}
  headerOffset={headerOffset}
  highlightDiff={highlightDiff}
  onToggleFocus={toggleFocus}
/>
            </>
          )
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="text-center text-muted-foreground py-10"
          >
            Pick at least 2 {def?.name.toLowerCase()} to compare.
          </motion.p>
        )}
      </motion.div>
    </LayoutGroup>
    
    
  );
  
}