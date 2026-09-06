"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const ACCENTS = {
  blue: {
    text: "text-blue-500",
    ring: "ring-blue-500/15",
    grad: "from-blue-500/10 to-blue-500/0",
  },
  emerald: {
    text: "text-emerald-500",
    ring: "ring-emerald-500/15",
    grad: "from-emerald-500/10 to-emerald-500/0",
  },
  amber: {
    text: "text-amber-500",
    ring: "ring-amber-500/15",
    grad: "from-amber-500/10 to-amber-500/0",
  },
  violet: {
    text: "text-violet-500",
    ring: "ring-violet-500/15",
    grad: "from-violet-500/10 to-violet-500/0",
  },
  cyan: {
    text: "text-cyan-500",
    ring: "ring-cyan-500/15",
    grad: "from-cyan-500/10 to-cyan-500/0",
  },
  rose: {
    text: "text-rose-500",
    ring: "ring-rose-500/15",
    grad: "from-rose-500/10 to-rose-500/0",
  },
} as const;

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  accent: keyof typeof ACCENTS;
  index?: number;
  size?: "default" | "compact";
}

export default function StatCard({
  label,
  value,
  icon,
  accent,
  index = 0,
  size = "default",
}: StatCardProps) {
  const c = ACCENTS[accent];
  const compact = size === "compact";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-zinc-200/70 dark:ring-zinc-800 ${c.ring} transition-shadow hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-none ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${c.grad} pointer-events-none`} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            {label}
          </p>
          <p
            className={`font-semibold text-zinc-900 dark:text-zinc-50 mt-2 tabular-nums ${
              compact ? "text-2xl" : "text-3xl"
            }`}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {value.toLocaleString()}
          </p>
        </div>

        <div
          className={`rounded-xl bg-white dark:bg-zinc-800 p-2 ring-1 ring-zinc-200/70 dark:ring-zinc-700 ${c.text}`}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}