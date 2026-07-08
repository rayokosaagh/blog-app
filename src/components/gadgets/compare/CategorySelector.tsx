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
    <div className="mb-6 flex overflow-x-auto">
      <div className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-border bg-black/[0.03] dark:bg-white/[0.03] p-1 backdrop-blur-sm">
        {categories.map((c) => {
          const active = c.slug === category;
          return (
            <motion.button
              key={c.slug}
              onClick={() => onChange(c.slug)}
              whileTap={{ scale: 0.96 }}
              whileHover={active ? undefined : { scale: 1.02 }}
              aria-pressed={active}
              className="relative shrink-0 rounded-xl px-4 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              {active && (
                <motion.span
                  layoutId="compare-category-pill"
                  className="absolute inset-0 rounded-xl bg-card shadow-[0_2px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.45)] ring-1 ring-border"
                  transition={{ type: "spring", stiffness: 450, damping: 34 }}
                />
              )}
              <span
                className={`relative z-10 flex items-center gap-1.5 transition-colors duration-200 ${
                  active ? "text-accent" : "text-muted-foreground hover:text-foreground"
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
  );
}