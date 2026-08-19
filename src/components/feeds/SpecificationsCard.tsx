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
  level = "h1",
}: {
  items: SpecItem[];
  title?: string;
  /** Heading tag as authored in the editor; the card renders it exactly as the article body would. */
  level?: string;
}) {
  // The post title owns the page's only h1, so an authored H1 ships as
  // h2[data-was-h1] (the numbered kicker style, same as the body); H2 is the
  // title style; H3/H4 keep their own tag. Older payloads without a level are
  // treated as H1 — what the card always rendered before.
  const Heading = (level === "h3" || level === "h4" ? level : "h2") as "h2" | "h3" | "h4";
  const wasH1 = level === "h1";
  return (
    <div className="not-prose">
      <Heading {...(wasH1 ? { "data-was-h1": "" } : {})}>{title}</Heading>

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