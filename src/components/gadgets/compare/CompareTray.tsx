"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Scale, ArrowRight } from "lucide-react";
import { useCompareTray, MAX_COMPARE } from "./CompareTrayProvider";

/**
 * Floating selection bar for the compare flow.
 *
 * Hidden on /compare itself — the page already shows the same products in its
 * slot picker, and a duplicate strip over the table just eats the viewport.
 */
export default function CompareTray() {
  const { items, remove, clear, compareHref } = useCompareTray();
  const pathname = usePathname();

  const hidden = items.length === 0 || pathname?.startsWith("/compare");

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          role="region"
          aria-label="Comparison selection"
          className="fixed inset-x-0 bottom-0 z-50 border-t-4 border-border-heavy bg-card shadow-[0_-4px_0_0_var(--border-heavy)]"
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
            <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
              <Scale className="h-4 w-4 text-accent" strokeWidth={2.5} />
              Compare
              <span className="tabular-nums">
                {items.length}/{MAX_COMPARE}
              </span>
            </span>

            <ul className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
              {items.map((i) => (
                <li
                  key={i.slug}
                  className="group relative flex shrink-0 items-center gap-2 border-2 border-border-heavy bg-background py-1 pl-1 pr-7"
                >
                  {i.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={i.image}
                      alt=""
                      className="h-8 w-8 shrink-0 object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="h-8 w-8 shrink-0 bg-muted" />
                  )}
                  <span className="max-w-[9rem] truncate text-xs font-bold text-foreground">
                    {i.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(i.slug)}
                    aria-label={`Remove ${i.name} from comparison`}
                    className="absolute right-1 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={3} />
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={clear}
                className="brutal-press border-2 border-border-heavy bg-card px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground shadow-brutal-sm hover:text-foreground"
              >
                Clear
              </button>

              {compareHref ? (
                <Link
                  href={compareHref}
                  className="brutal-press flex items-center gap-1.5 border-2 border-border-heavy bg-accent px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-on-accent shadow-brutal-sm"
                >
                  Compare now
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={3} />
                </Link>
              ) : (
                // One pick isn't a comparison — say what's missing rather than
                // offering a button that leads to a half-empty table.
                <span className="border-2 border-dashed border-border px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Pick one more
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
