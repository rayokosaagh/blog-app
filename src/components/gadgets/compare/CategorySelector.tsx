// src/components/gadgets/compare/CategorySelector.tsx
"use client";
import { motion } from "framer-motion";
import { CategoryOption } from "./types";

export default function CategorySelector({
  categories,
  category,
  onChange,
}: {
  categories: CategoryOption[];
  category: string;
  onChange: (slug: string) => void;
}) {
  return (
    <div className="mb-6 flex overflow-x-auto scrollbar-hide">
      <div className="inline-flex shrink-0 items-center gap-1 rounded-none border-2 border-border-heavy bg-muted p-1">
        {categories.map((c) => {
          const active = c.slug === category;
          return (
            <button
              key={c.slug}
              onClick={() => onChange(c.slug)}
              aria-pressed={active}
              className="relative shrink-0 rounded-none px-4 py-2 text-xs font-extrabold uppercase tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {active && (
                <motion.span
                  layoutId="compare-category-pill"
                  className="absolute inset-0 rounded-none border-2 border-border-heavy bg-accent-2 shadow-brutal-sm"
                  transition={{ type: "spring", stiffness: 450, damping: 34 }}
                />
              )}
              <span
                className={`relative z-10 flex items-center gap-1.5 transition-colors duration-100 ${
                  active ? "text-on-accent-2" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.icon && <i className={`${c.icon} text-base`} aria-hidden="true" />}
                {c.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}