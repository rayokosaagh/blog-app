"use client";

import { motion, type Variants } from "motion/react";
import { getSpecIcon, getSpecAccent } from "./specIcons";

interface SpecItem {
  label: string;
  value: string;
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

export default function SpecificationsCard({
  items,
  title = "Specifications",
}: {
  items: SpecItem[];
  title?: string;
}) {
  return (
    <div className="not-prose">
      {/* h2, not h1 — the post title owns the page's only h1. data-was-h1 keeps
          the original type scale (see .rich-text-render h2[data-was-h1] in
          blog/[slug]/page.tsx), so this is a semantics-only change. */}
      <h2 data-was-h1>{title}</h2>

      <motion.div
        className="flex flex-col rounded-none border-2 border-border-heavy overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {items.map((item, i) => {
          const Icon = getSpecIcon(item.label);
          const accent = getSpecAccent(item.label);
          return (
            <motion.div
              key={i}
              className={`flex items-stretch bg-card ${i > 0 ? "border-t-2 border-border" : ""}`}
              variants={itemVariants}
            >
              <div className={`w-1.5 shrink-0 ${accent.bar}`} />
              <div className="flex items-center gap-3 px-4 py-3.5 flex-1 min-w-0">
                <Icon className={`w-5 h-5 shrink-0 ${accent.icon}`} strokeWidth={2} />
                <span className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground w-28 shrink-0">
                  {item.label}
                </span>
                <span className="text-base font-bold text-foreground break-words">
                  {item.value}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}