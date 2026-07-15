"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, List } from "lucide-react";
import { motion } from "framer-motion";

interface TocItem {
  text: string;
  id: string;
  level: "h1" | "h2" | "h3" | "h4";
}

interface TocSidebarProps {
  toc: TocItem[];
  title: string;
}

// Square, hard-toggled marker instead of a soft scaling/fading circle —
// brutalism switches state, it doesn't ease into it.
function ActiveDot({ active }: { active: boolean }) {
  return (
    <span
      className={`shrink-0 w-2 h-2 mt-[7px] border-2 border-border-heavy ${
        active ? "bg-accent-2" : "bg-transparent"
      }`}
    />
  );
}

export default function TocSidebar({ toc, title }: TocSidebarProps) {
  const [showBreadcrumb, setShowBreadcrumb] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 });

  const observerRef = useRef<IntersectionObserver | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      setShowBreadcrumb(window.scrollY > 380);
      if (toc.length > 0) {
        const isAtBottom = window.innerHeight + Math.round(window.scrollY) >= document.documentElement.scrollHeight - 50;
        if (isAtBottom && toc.length > 0) {
          setActiveId(toc[toc.length - 1].id);
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [toc]);

  // Intersection Observer
  useEffect(() => {
    if (toc.length === 0) return;
    const headingEls = toc
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (headingEls.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-85px 0px -60% 0px", threshold: 0.3 }
    );

    headingEls.forEach((el) => observerRef.current!.observe(el));
    return () => observerRef.current?.disconnect();
  }, [toc]);

  // Update indicator position
  useEffect(() => {
    if (!activeId || !listRef.current) return;
    const activeLink = listRef.current.querySelector(`a[href="#${activeId}"]`) as HTMLElement;
    if (!activeLink) return;
    const li = activeLink.closest("li") as HTMLElement;
    if (!li) return;

    setIndicatorStyle({
      top: li.offsetTop + 2,
      height: activeLink.offsetHeight - 4,
    });
  }, [activeId]);

  return (
    <aside className="sticky top-6 self-start w-full bg-card border-2 border-border-heavy rounded-none shadow-brutal px-6 py-8 md:px-8 max-h-[calc(100dvh-3rem)] overflow-y-auto overscroll-contain">
      {/* Breadcrumb */}
      <div
        className={`overflow-hidden border-border transition-all duration-300 ease-in-out ${
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

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <List size={22} className="text-accent" />
          <h2 className="text-2xl font-extrabold text-foreground">Contents</h2>
        </div>
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="p-1.5 -m-1 rounded-none border-2 border-transparent text-muted-foreground hover:text-on-accent-2 hover:bg-accent-2 hover:border-border-heavy transition-colors shrink-0"
        >
          <ChevronDown size={18} className={`transition-transform duration-300 ${isCollapsed ? "-rotate-90" : ""}`} />
        </button>
      </div>

      <div className="border-b-2 border-border-heavy mt-4 mb-4" />

      <div className={`grid transition-all duration-300 ease-in-out ${isCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}>
        <div className="overflow-hidden">
          <nav className="relative">
            {toc.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No sections found.</p>
            ) : (
              <div className="relative pl-4">
                {/* Background Track — solid 2px rule, not a translucent hairline */}
                <div className="absolute left-[7px] top-3 bottom-3 w-[2px] bg-border" />

                {/* Solid hard-edged indicator block — no gradient, no blur/glow */}
                <motion.div
                  className="absolute left-[3px] w-[6px] bg-accent-2 border-2 border-border-heavy"
                  animate={{
                    top: indicatorStyle.top,
                    height: indicatorStyle.height,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 320,
                    damping: 30,
                    mass: 0.7,
                  }}
                />

                <ul ref={listRef} className="space-y-0.5">
                  {toc.map((item) => {
                    const isActive = activeId === item.id;
                    const isSub = item.level === "h3" || item.level === "h4";

                    return (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          onClick={() => setActiveId(item.id)}
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
                  })}
                </ul>
              </div>
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
}