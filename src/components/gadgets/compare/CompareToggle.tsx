"use client";

import { Check, Plus, Scale } from "lucide-react";
import { useCompareTray, type CompareItem, MAX_COMPARE } from "./CompareTrayProvider";

/**
 * "Add to compare" control. Rendered on product cards (inside the card's own
 * <Link>, hence the event suppression) and on the product page.
 *
 * When the tray already holds a different category the control is disabled
 * rather than hidden: a laptop and a phone have no spec fields in common, and
 * silently swapping the reader's selection is worse than saying why not.
 */
export default function CompareToggle({
  item,
  variant = "card",
}: {
  item: CompareItem;
  variant?: "card" | "wide";
}) {
  const { has, canAdd, toggle, category, items } = useCompareTray();

  const selected = has(item.slug);
  const allowed = selected || canAdd(item.categorySlug);
  const wrongCategory = !selected && category !== null && category !== item.categorySlug;

  const reason = wrongCategory
    ? "Clear your comparison first — only gadgets in the same category can be compared"
    : !allowed
      ? `You can compare up to ${MAX_COMPARE} at once`
      : selected
        ? "Remove from comparison"
        : "Add to comparison";

  function onClick(e: React.MouseEvent) {
    // The card is one big <Link>; without this, ticking the box navigates.
    e.preventDefault();
    e.stopPropagation();
    if (allowed) toggle(item);
  }

  if (variant === "wide") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!allowed}
        aria-pressed={selected}
        title={reason}
        className={`brutal-press flex items-center justify-center gap-2 border-2 border-border-heavy px-4 py-2.5 text-xs font-bold uppercase tracking-wide shadow-brutal-sm transition-colors ${
          selected
            ? "bg-accent-2 text-on-accent-2"
            : allowed
              ? "bg-card text-foreground hover:bg-accent-tint"
              : "cursor-not-allowed bg-muted text-muted-foreground opacity-70"
        }`}
      >
        <Scale className="h-4 w-4 shrink-0" strokeWidth={2.5} />
        {selected
          ? `In comparison (${items.length}/${MAX_COMPARE})`
          : "Add to comparison"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!allowed}
      aria-pressed={selected}
      aria-label={reason}
      title={reason}
      className={`flex h-6 w-6 shrink-0 items-center justify-center border-2 border-border-heavy transition-colors ${
        selected
          ? "bg-accent-2 text-on-accent-2"
          : allowed
            ? "bg-background text-muted-foreground hover:bg-accent-tint hover:text-foreground"
            : "cursor-not-allowed bg-muted text-muted-foreground/50"
      }`}
    >
      {selected ? (
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      ) : (
        <Plus className="h-3.5 w-3.5" strokeWidth={3} />
      )}
    </button>
  );
}
