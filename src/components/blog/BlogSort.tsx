// src/components/blog/BlogSort.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock, History, Flame } from "lucide-react";
import { DEFAULT_SORT, parseSort, type SortKey } from "@/lib/blogSort";

const SORT_OPTIONS: {
  key: SortKey;
  label: string;
  icon: typeof Clock;
}[] = [
  { key: "newest", label: "Newest", icon: Clock },
  { key: "oldest", label: "Oldest", icon: History },
  { key: "popular", label: "Most read", icon: Flame },
];

/**
 * Segmented sort control for the blog listing.
 *
 * Rendered as real <Link>s rather than a JS-driven <select> so each ordering is
 * a crawlable, shareable URL and the control still works before hydration.
 * Changing the sort drops `page` — page 4 of "Newest" has no meaningful
 * counterpart in "Most read", so we send the reader back to the first page.
 */
export default function BlogSort({ total }: { total: number }) {
  const searchParams = useSearchParams();
  const active = parseSort(searchParams.get("sort"));

  function hrefFor(key: SortKey) {
    const params = new URLSearchParams(searchParams);
    if (key === DEFAULT_SORT) params.delete("sort");
    else params.set("sort", key);
    params.delete("page");
    const qs = params.toString();
    return qs ? `/blog?${qs}` : "/blog";
  }

  return (
    <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {total} {total === 1 ? "article" : "articles"}
      </p>

      <div
        role="group"
        aria-label="Sort articles"
        className="inline-flex items-center border-[1.5px] border-border-heavy rounded-md bg-card overflow-hidden"
      >
        {SORT_OPTIONS.map((opt, i) => {
          const isActive = opt.key === active;
          const Icon = opt.icon;
          return (
            <Link
              key={opt.key}
              href={hrefFor(opt.key)}
              scroll={false}
              aria-current={isActive ? "true" : undefined}
              // The label is display:none under `sm`, which also hides it from
              // assistive tech — so name the link explicitly for the icon-only
              // mobile layout.
              aria-label={`Sort by ${opt.label}`}
              title={opt.label}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                i > 0 ? "border-l-[1.5px] border-border-heavy" : ""
              } ${
                isActive
                  ? "bg-accent text-on-accent"
                  : "text-muted-foreground hover:bg-accent-tint hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{opt.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
