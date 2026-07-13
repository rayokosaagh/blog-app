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

function ActiveDot({ active }: { active: boolean }) {
  return (
    <motion.div
      className="shrink-0 w-1.5 h-1.5 rounded-full mt-[7px]"
      animate={{
        scale: active ? 1.35 : 0.75,
        backgroundColor: active 
          ? "rgb(37 99 235)"     // blue-600 in light
          : "var(--border)",
        opacity: active ? 1 : 0.5,
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        // This helps with dark mode consistency
        backgroundColor: active ? undefined : undefined,
      }}
    />
  );
}

export default function TocSidebar({ toc, title }: TocSidebarProps) {
  const [showBreadcrumb, setShowBreadcrumb] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 });
  const [accentColor, setAccentColor] = useState("#2563eb");

  const observerRef = useRef<IntersectionObserver | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Detect dark mode and update accent color
  useEffect(() => {
    const updateAccentColor = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setAccentColor(isDark ? "#ffffff" : "#2563eb");
    };

    updateAccentColor();

    const observer = new MutationObserver(updateAccentColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

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
    <aside className="sticky top-6 self-start w-full bg-card border border-border rounded-2xl shadow-xl px-6 py-8 md:px-8 max-h-[calc(100dvh-3rem)] overflow-y-auto overscroll-contain">
      {/* Breadcrumb */}
      <div
        className={`overflow-hidden border-border transition-all duration-300 ease-in-out ${
          showBreadcrumb ? "max-h-20 opacity-100 mb-5 pb-4 border-b" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span className="text-border">›</span>
          <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <span className="text-border">›</span>
          <span className="truncate text-muted-foreground/70" title={title}>{title}</span>
        </nav>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <List size={22} className="text-blue-600 dark:text-white" />
          <h2 className="text-2xl font-bold text-foreground">Contents</h2>
        </div>
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="p-1.5 -m-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors shrink-0"
        >
          <ChevronDown size={18} className={`transition-transform duration-300 ${isCollapsed ? "-rotate-90" : ""}`} />
        </button>
      </div>

      <div className="border-b border-border mt-4 mb-4" />

      <div className={`grid transition-all duration-300 ease-in-out ${isCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}>
        <div className="overflow-hidden">
          <nav className="relative">
            {toc.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No sections found.</p>
            ) : (
              <div className="relative pl-4">
                {/* Background Track */}
                <div className="absolute left-[7px] top-3 bottom-3 w-px bg-border rounded-full" />

                {/* Dynamic Purple/White Indicator */}
                <motion.div
                  className="absolute left-[3px] w-[5px] rounded-full shadow-lg"
                  style={{
                    background: `linear-gradient(to bottom, ${accentColor}, ${
                      accentColor === "#ffffff" ? "#e0e0e0" : "#60a5fa"
                    }, ${accentColor})`,
                    boxShadow: `0 0 12px ${accentColor}30`,
                  }}
                  animate={{
                    top: indicatorStyle.top,
                    height: indicatorStyle.height,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 280,
                    damping: 28,
                    mass: 0.8,
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
                          className={`group flex items-start gap-3 rounded-xl px-3 py-[11px] text-sm transition-all duration-200 ${
                            isSub ? "pl-8 text-[13px]" : "font-medium"
                          } ${
                            isActive
                              ? "text-blue-600 dark:text-white"
                              : "text-muted-foreground hover:text-blue-600 dark:hover:text-white hover:bg-blue-50/80 dark:hover:bg-zinc-800"
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