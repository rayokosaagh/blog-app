"use client";

import { useEffect, useState } from "react";
import { List } from "lucide-react";
import { SpecGroup } from "@/lib/gadgets/types";
import { slugifyTitle } from "@/lib/gadgets/formatSpecValue";

interface ProductSpecNavProps {
  groups: SpecGroup[];
  specs: Record<string, unknown>;
}

export default function ProductSpecNav({ groups, specs }: ProductSpecNavProps) {
  const visibleGroups = groups.filter((g) =>
    g.fields.some((f) => specs[f.key] !== null && specs[f.key] !== undefined && specs[f.key] !== "")
  );

  const sectionIds = visibleGroups.map((g) => slugifyTitle(g.title));

  const [activeId, setActiveId] = useState<string>(sectionIds[0] ?? "");

  const sectionKey = sectionIds.join("|");

  // Scroll-driven active-section tracking that re-measures the live DOM every
  // frame. We avoid IntersectionObserver on purpose: the page is wrapped in a
  // framer-motion <PageTransition> (AnimatePresence mode="popLayout") that
  // reparents the page subtree on client-side navigation, detaching the nodes
  // an observer bound to — so the spy dies until a full reload. Re-querying on
  // each scroll re-resolves the sections every time and survives that.
  useEffect(() => {
    const ids = sectionKey ? sectionKey.split("|") : [];
    if (ids.length === 0) return;

    let ticking = false;
    const compute = () => {
      const atBottom =
        window.innerHeight + Math.round(window.scrollY) >=
        document.documentElement.scrollHeight - 50;
      if (atBottom) {
        setActiveId(ids[ids.length - 1]);
        return;
      }
      // Active = the last section whose top has scrolled above the trigger line.
      const TRIGGER = 120;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - TRIGGER <= 0) current = id;
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
  }, [sectionKey]);

  if (visibleGroups.length === 0) return null;

  return (
    <nav className="hidden lg:block sticky top-24 self-start w-56 shrink-0">
      <div className="border-4 border-border-heavy bg-card shadow-brutal-lg rounded-none overflow-hidden">
        <div className="hero-titlebar flex items-center gap-2 bg-accent text-on-accent px-4 py-3 border-b-4 border-border-heavy">
          <List className="w-3.5 h-3.5 shrink-0" />
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em]">
            Jump to
          </p>
        </div>
        <ul>
          {visibleGroups.map((g, i) => {
            const id = slugifyTitle(g.title);
            const isActive = activeId === id;
            return (
              <li
                key={id}
                className="border-b-2 border-border last:border-b-0"
              >
                <a
                  href={`#${id}`}
                  className={`flex items-center gap-2.5 pl-3 pr-4 py-2.5 border-l-8 text-xs font-extrabold uppercase tracking-wide transition-all duration-100 ${
                    isActive
                      ? "border-border-heavy bg-accent-2 text-on-accent-2 translate-x-0.5"
                      : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border"
                  }`}
                >
                  <span
                    className={`text-[9px] font-black tabular-nums shrink-0 ${
                      isActive ? "text-on-accent-2/60" : "text-muted-foreground/50"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="line-clamp-1">{g.title}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}