"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { ChevronDown, List, Search, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

interface TocItem {
  text: string;
  id: string;
  level: "h1" | "h2" | "h3" | "h4";
}

interface TocSidebarProps {
  toc: TocItem[];
  title: string;
}

// Distance from the viewport top that counts as "you are here". The spy and
// the click-to-scroll use the SAME value so they always agree, and it keeps
// the target heading clear of the sticky masthead.
const SCROLL_OFFSET = 100;

// Past this many entries the list gets its own filter box. Below it the extra
// control is just noise on a list you can already take in at a glance.
const FILTER_THRESHOLD = 10;

// Square, hard-toggled marker instead of a soft scaling/fading circle —
// brutalism switches state, it doesn't ease into it. Rounds to a dot in
// modern, where the rest of the UI is soft.
function ActiveDot({ active }: { active: boolean }) {
  return (
    <span
      className={`shrink-0 w-2 h-2 mt-[7px] border-2 border-border-heavy ${
        active ? "bg-accent-2" : "bg-transparent"
      }`}
      style={{ borderRadius: "var(--radius-pill, 0)" }}
    />
  );
}

export default function TocSidebar({ toc, title }: TocSidebarProps) {
  const [showBreadcrumb, setShowBreadcrumb] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 });
  const [progress, setProgress] = useState(0);
  const [query, setQuery] = useState("");
  const [edges, setEdges] = useState({ up: false, down: false });

  const listRef = useRef<HTMLUListElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const showFilter = toc.length > FILTER_THRESHOLD;
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => (q ? toc.filter((i) => i.text.toLowerCase().includes(q)) : toc),
    [toc, q],
  );

  const activeIndex = toc.findIndex((i) => i.id === activeId);

  // Scroll-driven active-section tracking.
  //
  // We deliberately do NOT use IntersectionObserver here: the page is wrapped
  // in a framer-motion <PageTransition> (AnimatePresence mode="popLayout"),
  // which reparents the page subtree on client-side navigation. That detaches
  // the exact nodes an observer had bound to, so the spy silently dies until a
  // full reload. Re-measuring the live DOM on each scroll re-resolves the
  // headings every time, so it survives the transition.
  useEffect(() => {
    let ticking = false;

    const compute = () => {
      setShowBreadcrumb(window.scrollY > 380);

      // Reading progress across the whole document.
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);

      if (toc.length === 0) return;

      const atBottom =
        window.innerHeight + Math.round(window.scrollY) >=
        document.documentElement.scrollHeight - 50;
      if (atBottom) {
        setActiveId(toc[toc.length - 1].id);
        return;
      }

      // Active = the last heading whose top has scrolled above the trigger line.
      let current = toc[0].id;
      for (const { id } of toc) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - SCROLL_OFFSET <= 0) current = id;
        else break;
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        compute();
        ticking = false;
      });
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [toc]);

  // Move the rail indicator onto the active row.
  useEffect(() => {
    const activeLink = listRef.current?.querySelector(
      `a[href="#${CSS.escape(activeId)}"]`,
    ) as HTMLElement | null;

    // Active row can be filtered out of view — collapse the indicator rather
    // than leaving it stranded on an unrelated row.
    if (!activeId || !activeLink) {
      setIndicatorStyle((s) => (s.height === 0 ? s : { top: s.top, height: 0 }));
      return;
    }
    const li = activeLink.closest("li") as HTMLElement | null;
    if (!li) return;

    setIndicatorStyle({ top: li.offsetTop + 2, height: activeLink.offsetHeight - 4 });
  }, [activeId, visible]);

  // Keep the active row inside the sidebar's own scroll window. Without this
  // the spy silently highlights rows that are scrolled out of the panel, which
  // is exactly when a long TOC stops being useful.
  useEffect(() => {
    const container = scrollRef.current;
    const link = listRef.current?.querySelector(
      `a[href="#${CSS.escape(activeId)}"]`,
    ) as HTMLElement | null;
    if (!container || !link || isCollapsed) return;

    const pad = 12;
    const cRect = container.getBoundingClientRect();
    const lRect = link.getBoundingClientRect();

    let delta = 0;
    if (lRect.top < cRect.top + pad) delta = lRect.top - cRect.top - pad;
    else if (lRect.bottom > cRect.bottom - pad) delta = lRect.bottom - cRect.bottom + pad;
    if (delta === 0) return;

    container.scrollTo({
      top: container.scrollTop + delta,
      behavior: reduced ? "auto" : "smooth",
    });
  }, [activeId, isCollapsed, reduced]);

  // Fade hints telling you there's more list above/below the scroll window.
  const syncEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const overflowing = el.scrollHeight > el.clientHeight + 1;
    setEdges({
      up: overflowing && el.scrollTop > 2,
      down: overflowing && el.scrollTop < el.scrollHeight - el.clientHeight - 2,
    });
  }, []);

  useEffect(() => {
    syncEdges();
  }, [syncEdges, visible, isCollapsed]);

  // Jump to a heading with the same offset the spy uses, so the row you
  // clicked is the row that lights up. Native anchor jumps land the heading
  // under the sticky masthead instead.
  const jumpTo = useCallback(
    (e: React.MouseEvent, id: string) => {
      const el = document.getElementById(id);
      if (!el) return; // let the browser handle it
      e.preventDefault();
      const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
      window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
      setActiveId(id);
      window.history.replaceState(null, "", `#${id}`);
    },
    [reduced],
  );

  return (
    <aside className="sticky top-6 self-start w-full flex flex-col bg-card surface-border shadow-brutal px-6 py-8 md:px-8 max-h-[calc(100dvh-3rem)]">
      {/* Breadcrumb */}
      <div
        className={`shrink-0 overflow-hidden border-border transition-all duration-300 ease-in-out ${
          showBreadcrumb ? "max-h-20 opacity-100 mb-5 pb-4 border-b-2" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wide">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <span className="text-border">›</span>
          <Link href="/blog" className="hover:text-accent transition-colors">Blog</Link>
          <span className="text-border">›</span>
          <span className="truncate text-muted-foreground/70 normal-case font-medium" title={title}>{title}</span>
        </nav>
      </div>

      {/* gap-2 and a smaller heading below 1600: this rail is now fluid-width
          (216px at 1440, see .article-rail in blog/[slug]/page.tsx), and at
          text-2xl + gap-4 the heading truncated to "C…" — the one thing in a
          table of contents that must never be abbreviated. */}
      <div className="shrink-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <List size={18} className="text-accent shrink-0" />
          <h2 className="text-xl min-[1600px]:text-2xl font-extrabold text-foreground truncate">Contents</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Position in the article — turns a long list into "where am I" */}
          {/* Hidden on the narrow rail: the progress bar directly below already
              says where you are, and this counter was the last 32px standing
              between the heading and being clipped to "C…". */}
          {toc.length > 0 && activeIndex >= 0 && (
            <span className="hidden min-[1520px]:inline text-[11px] font-extrabold tabular-nums text-muted-foreground">
              {activeIndex + 1}/{toc.length}
            </span>
          )}
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? "Expand contents" : "Collapse contents"}
            className="p-1.5 -m-1 rounded-none border-2 border-transparent text-muted-foreground hover:text-on-accent-2 hover:bg-accent-2 hover:border-border-heavy transition-colors shrink-0"
          >
            <ChevronDown size={18} className={`transition-transform duration-300 ${isCollapsed ? "-rotate-90" : ""}`} />
          </button>
        </div>
      </div>

      {/* Reading progress */}
      {toc.length > 0 && (
        <div
          className="shrink-0 mt-3 h-2 w-full overflow-hidden bg-border"
          style={{ borderRadius: "var(--radius-pill, 0)" }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Reading progress"
        >
          <motion.div
            className="h-full bg-accent"
            animate={{ width: `${progress * 100}%` }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 30 }}
          />
        </div>
      )}

      <div className="shrink-0 border-b-2 border-border-heavy mt-4 mb-4" />

      {/* Filter — only for lists long enough to be worth searching */}
      {showFilter && !isCollapsed && (
        <div className="shrink-0 relative mb-3">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter sections…"
            aria-label="Filter sections"
            className="w-full surface-border bg-background py-1.5 pl-8 pr-8 text-xs font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-accent"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear filter"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      <div
        className={`grid min-h-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        }`}
      >
        <div className="overflow-hidden min-h-0">
          <nav className="relative min-h-0" aria-label="Table of contents">
            {toc.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No sections found.</p>
            ) : (
              <div className="relative">
                {/* Only the list scrolls — the heading, progress bar and filter
                    stay pinned, so a 30-entry TOC doesn't push them away. */}
                <div
                  ref={scrollRef}
                  onScroll={syncEdges}
                  className="relative max-h-[52vh] overflow-y-auto overscroll-contain pl-4 pr-1"
                >
                  {/* Background Track — solid 2px rule, not a translucent hairline */}
                  <div className="absolute left-[7px] top-3 bottom-3 w-[2px] bg-border" />

                  {/* Solid hard-edged indicator block — no gradient, no blur/glow */}
                  <motion.div
                    className="absolute left-[3px] w-[6px] bg-accent-2 border-2 border-border-heavy"
                    animate={{ top: indicatorStyle.top, height: indicatorStyle.height }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 320, damping: 30, mass: 0.7 }
                    }
                  />

                  <ul ref={listRef} className="space-y-0.5">
                    {visible.length === 0 ? (
                      <li className="px-3 py-3 text-xs italic text-muted-foreground">
                        No sections match “{query}”.
                      </li>
                    ) : (
                      visible.map((item) => {
                        const isActive = activeId === item.id;
                        const isSub = item.level === "h3" || item.level === "h4";

                        return (
                          <li key={item.id}>
                            <a
                              href={`#${item.id}`}
                              onClick={(e) => jumpTo(e, item.id)}
                              aria-current={isActive ? "location" : undefined}
                              className={`group flex items-start gap-3 rounded-none px-3 py-[11px] text-sm transition-colors duration-150 ${
                                isSub ? "pl-8 text-[13px]" : "font-bold"
                              } ${
                                isActive
                                  ? "text-foreground bg-accent-tint"
                                  : "text-muted-foreground hover:text-on-accent-2 hover:bg-accent-2"
                              }`}
                            >
                              <ActiveDot active={isActive} />
                              <span className="leading-tight pt-0.5">{item.text}</span>
                            </a>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>

                {/* Edge fades — "there's more here" without a scrollbar */}
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-x-0 top-0 h-6 transition-opacity duration-200 ${
                    edges.up ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ background: "linear-gradient(to bottom, var(--card), transparent)" }}
                />
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-x-0 bottom-0 h-6 transition-opacity duration-200 ${
                    edges.down ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ background: "linear-gradient(to top, var(--card), transparent)" }}
                />
              </div>
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
}
