"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { GadgetCategoryDef, SpecField } from "@/lib/gadgets/types";

import { CategoryOption, Product, ProductLite } from "./compare/types";
import CategorySelector from "./compare/CategorySelector";
import ProductSlots from "./compare/ProductSlots";
import ControlsBar from "./compare/ControlsBar";
import CompactCompareBar from "./compare/CompactCompareBar";
import FocusedSpecBar from "./compare/FocusedSpecBar";
import DesktopTable from "./compare/DesktopTable";
import MobileTable from "./compare/MobileTable";
import ComparisonVerdict, { type EditorVerdict } from "./compare/ComparisonVerdict";
import { visibleFieldsAcross } from "@/lib/gadgets/formatSpecValue";
import EmptyState from "@/components/ui/EmptyState";
import { SlidersHorizontal } from "lucide-react";

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
  const [highlightDiff, setHighlightDiff] = useState(false);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [keyOnly, setKeyOnly] = useState(false);
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

  // Sticky layout, GadgetByte-style: the category tabs, slot cards and
  // controls scroll away normally; only the compact bar (product row +
  // section chips) sticks, just under the site navbar.
  //
  // navHeight — the site header is itself sticky at top:0, so the bar has to
  //   sit below it rather than slide underneath (which the old header did).
  // stuck — the full slot cards have scrolled out from under the navbar, so
  //   the bar's compact product row opens in their place.
  // headerOffset — how much of the viewport the navbar + *pinned* bar cover,
  //   so section jumps and the scroll-spy line land below them. Measured as
  //   the pinned height even before pinning, since that's where a jump ends up.
  const slotsRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [navHeight, setNavHeight] = useState(0);
  const [stuck, setStuck] = useState(false);
  const [headerOffset, setHeaderOffset] = useState(0);

  // Navbar is rendered by each page, not the root layout, so after a
  // client-side navigation the outgoing page's header is still in the DOM
  // when this runs — and querySelector returns it first. It's removed a beat
  // later and measures 0, which pinned the bar at top:0 under the new header.
  // Whenever the watched header leaves the document, re-resolve to the live one.
  useEffect(() => {
    let nav: HTMLElement | null = null;
    const ro = new ResizeObserver(() => update());
    const update = () => {
      if (!nav?.isConnected) {
        if (nav) ro.unobserve(nav);
        nav = document.querySelector<HTMLElement>(".header-frame");
        if (!nav) return;
        ro.observe(nav);
      }
      setNavHeight(nav.offsetHeight);
    };
    update();
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = slotsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top < navHeight),
      { rootMargin: `-${navHeight}px 0px 0px 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [navHeight]);

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

  // Spec groups shown in the table — filtered by "only differences",
  // "key specs" (fields flagged `important` in the category def) and by the
  // free-text field-label search.
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
          if (keyOnly && !f.important) return false;
          if (q &&!f.label.toLowerCase().includes(q) && !g.title.toLowerCase().includes(q)) return false;
          if (onlyDiff) {
            const vals = filledProducts.map((p) => JSON.stringify(p.specs?.[f.key] ?? null));
            return new Set(vals).size > 1;
          }
          return true;
        }),
      }))
      .filter((g) => g.fields.length > 0);
  }, [onlyDiff, keyOnly, def, filledProducts, fieldFilter]);

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

  // Pinned bar height = its current height, plus the compact product row's
  // natural height while that row is still collapsed (it opens on pinning).
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) {
      setHeaderOffset(navHeight);
      return;
    }
    const update = () => {
      const row = bar.querySelector<HTMLElement>("[data-compact-products]");
      const collapsedRow = stuck ? 0 : (row?.offsetHeight ?? 0);
      setHeaderOffset(navHeight + bar.offsetHeight + collapsedRow);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(bar);
    return () => ro.disconnect();
  }, [navHeight, stuck, showComparison]);

  // Filled products in table order, each with the slot it occupies (the
  // compact bar's remove button needs the slot, the table needs the order).
  const barProducts = useMemo(
    () =>
      slots.flatMap((s, slotIndex) => (s ? [{ product: s, slotIndex }] : [])),
    [slots],
  );

  // "+ Add" in the compact bar: back up to the slot cards, into the first
  // empty slot's search — or reveal a hidden slot if every visible one is full.
  function addFromBar() {
    const el = slotsRef.current;
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - navHeight - 16, behavior: "smooth" });
    const emptyIndex = slots.findIndex((s) => !s);
    const inputs = el.querySelectorAll<HTMLInputElement>("input");
    const target = emptyIndex >= 0 ? inputs[emptyIndex] : undefined;
    if (target) {
      target.focus({ preventScroll: true });
      return;
    }
    el.querySelector<HTMLButtonElement>('button[aria-label="Add another product to compare"]')?.click();
    // The revealed slot mounts on the next render; focus its search then.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const all = el.querySelectorAll<HTMLInputElement>("input");
        all[all.length - 1]?.focus({ preventScroll: true });
      }),
    );
  }

  return (
    <LayoutGroup>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-none border-2 border-border-heavy bg-card shadow-brutal-lg p-4 sm:p-8"
      >
        <div className="mb-6">
          <h1 className="h-page-title text-foreground">
            Compare Gadgets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pick two or more gadgets to see them side by side.
          </p>
        </div>

        {/* ── Selection: category tabs, full slot cards, controls.
             Scrolls away normally; the compact bar below takes over. ── */}
        <div>
          <CategorySelector categories={categories} category={category} onChange={handleCategoryChange} />

          <div ref={slotsRef}>
            <ProductSlots
              maxSlots={maxSlots}
              slots={slots}
              categoryProducts={categoryProducts}
              usedSlugs={usedSlugs}
              onPick={handlePick}
              onRemove={handleRemove}
            />
          </div>

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
              keyOnly={keyOnly}
              onKeyOnlyChange={setKeyOnly}
            />
          )}

        </div>

        {/* ── Compact sticky bar: pinned under the site navbar while the
             spec table scrolls. Product row on the table's columns +
             section chips; the focused-spec strip rides along. ── */}
        {showComparison && (
          <div
            ref={barRef}
            className="sticky z-20 -mx-4 sm:-mx-8 px-4 sm:px-8 pt-2 pb-2 bg-background"
            style={{ top: navHeight }}
          >
            <CompactCompareBar
              products={barProducts}
              stuck={stuck}
              highlightDiff={highlightDiff}
              onHighlightDiffChange={setHighlightDiff}
              onlyDiff={onlyDiff}
              onOnlyDiffChange={setOnlyDiff}
              keyOnly={keyOnly}
              onKeyOnlyChange={setKeyOnly}
              onRemove={handleRemove}
              canAdd={filledProducts.length < maxSlots}
              onAdd={addFromBar}
              groups={groups}
              activeGroupTitle={activeGroupTitle}
              onJump={jumpToGroup}
            />
            <FocusedSpecBar
              focusedField={focusedField}
              focusedKey={focusedKey}
              filledProducts={filledProducts}
              onClear={() => setFocusedKey(null)}
            />
          </div>
        )}
        {/* ── /Compact sticky bar ──────────────────────────────────── */}

        {showComparison ? (
          groups.length === 0 ? (
            <EmptyState
              variant="brutal"
              icon={SlidersHorizontal}
              title={
                fieldFilter.trim()
                  ? `No specs match "${fieldFilter}"`
                  : onlyDiff
                    ? keyOnly
                      ? "These products match on every key spec"
                      : "These products match on every spec"
                    : keyOnly
                      ? "No key specs filled in yet"
                      : "No specs to compare yet"
              }
              description={
                fieldFilter.trim()
                  ? "Try a shorter search term."
                  : onlyDiff
                    ? 'Turn off "differences only" to see the full spec sheet.'
                    : keyOnly
                      ? 'Turn off "Key specs" to see the full spec sheet.'
                      : "Neither product has any specifications filled in yet."
              }
            />
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