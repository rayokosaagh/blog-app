"use client";

import { useEffect, useRef, useState } from "react";
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

  const [activeId, setActiveId] = useState<string>(
    visibleGroups[0] ? slugifyTitle(visibleGroups[0].title) : ""
  );
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sections = visibleGroups
      .map((g) => document.getElementById(slugifyTitle(g.title)))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    // Track how visible each section currently is, instead of trusting
    // whichever entry happens to come first in a given callback batch —
    // IntersectionObserver only reports entries whose state *changed*, so
    // picking "the first intersecting one" from that batch can pick a
    // section that isn't actually the one on screen once you're scrolling
    // fast through several tall sections in a row.
    const ratios = new Map<string, number>();

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        let bestId: string | null = null;
        let bestRatio = 0;
        for (const section of sections) {
          const ratio = ratios.get(section.id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = section.id;
          }
        }
        if (bestId) setActiveId(bestId);
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (visibleGroups.length === 0) return null;

  return (
    <nav className="hidden lg:block sticky top-24 self-start w-56 shrink-0">
      <div className="border-4 border-border-heavy bg-card shadow-brutal-lg rounded-none overflow-hidden">
        <div className="flex items-center gap-2 bg-foreground text-background px-4 py-3 border-b-4 border-border-heavy">
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