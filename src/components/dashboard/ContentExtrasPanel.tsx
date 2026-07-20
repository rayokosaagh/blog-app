// components/ContentExtrasPanel.tsx
"use client";

import { motion } from "framer-motion";
import { Star, MessageSquareText, Tag, Package, Share2 } from "lucide-react";

interface ContentExtrasPanelProps {
  avgRating: number;
  totalRatings: number;
  blogTags: number;
  productTags: number;
  activeSocials: number;
}

const ITEMS = (props: ContentExtrasPanelProps) => [
  {
    label: "Average rating",
    value: props.avgRating ? props.avgRating.toFixed(1) : "—",
    suffix: props.avgRating ? "/ 5" : "",
    icon: Star,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-500/10",
  },
  {
    label: "Total ratings",
    value: props.totalRatings.toLocaleString(),
    suffix: "",
    icon: MessageSquareText,
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-500/10",
  },
  {
    label: "Blog tags",
    value: props.blogTags.toLocaleString(),
    suffix: "",
    icon: Tag,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-500/10",
  },
  {
    label: "Product tags",
    value: props.productTags.toLocaleString(),
    suffix: "",
    icon: Package,
    color: "text-cyan-500",
    bg: "bg-cyan-50 dark:bg-cyan-500/10",
  },
  {
    label: "Active social links",
    value: props.activeSocials.toLocaleString(),
    suffix: "",
    icon: Share2,
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-500/10",
  },
];

export default function ContentExtrasPanel(props: ContentExtrasPanelProps) {
  const items = ITEMS(props);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.34 }}
      className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden"
    >
      <div className="px-6 pt-6 pb-1">
        <h3
          className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Content extras
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 dark:divide-zinc-800">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="p-6 flex items-center gap-4">
              <div className={`rounded-xl p-2.5 ${item.bg} ${item.color} shrink-0`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide truncate">
                  {item.label}
                </p>
                <p
                  className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mt-1 tabular-nums"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {item.value}
                  {item.suffix && (
                    <span className="text-sm text-zinc-400 dark:text-zinc-500 ml-1">{item.suffix}</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
