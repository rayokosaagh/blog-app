import type { SpecField } from "@/lib/gadgets/types";
import { formatSpecValue } from "@/lib/gadgets/formatSpecValue";

// Column geometry shared by the spec tables and the sticky compact bar, so
// the bar's product thumbnails sit exactly over their own spec columns.
// The label column is fixed; product columns split what's left equally
// (the tables use `table-layout: fixed` to honour this).

/** Spec-label column width, px. */
export const LABEL_COL_PX = { desktop: 200, mobile: 108 } as const;

/**
 * Narrowest a product column may get on phones before the table scrolls
 * sideways instead of squeezing values unreadably.
 */
export const MOBILE_PRODUCT_MIN_PX = 100;

/**
 * Each product's colour, by its position in the comparison: the first takes
 * the primary accent, the second the secondary, the third the tertiary. `bar`
 * runs down its header and every value cell and `chip` fills the band on its
 * sticky-bar card, so the two read as one key; `wash` tints its cells only on
 * rows Highlight marks as differing. Full class strings so Tailwind sees them.
 *
 * `bar` is an inset shadow, not a border: the modern theme thins every
 * `border-l-4` to 1px, which is how the old card strips became near-invisible.
 */
export const PRODUCT_ACCENTS = [
  {
    chip: "bg-accent",
    bar: "shadow-[inset_4px_0_0_var(--accent)]",
    wash: "bg-accent/10",
  },
  {
    chip: "bg-accent-2",
    bar: "shadow-[inset_4px_0_0_var(--accent-2)]",
    wash: "bg-accent-2/10",
  },
  {
    chip: "bg-accent-3",
    bar: "shadow-[inset_4px_0_0_var(--accent-3)]",
    wash: "bg-accent-3/10",
  },
] as const;

export function productAccent(index: number) {
  return PRODUCT_ACCENTS[index % PRODUCT_ACCENTS.length];
}

/**
 * Alternate-row shading for the spec tables. The row gets a translucent muted
 * wash (value cells are translucent too, so it shows through their product
 * wash); the sticky label cell must stay opaque to cover cells scrolling
 * under it, so it gets the same shade pre-mixed onto --card.
 */
export const ZEBRA = {
  row: "bg-muted/60",
  label: "bg-[color-mix(in_srgb,var(--muted)_60%,var(--card))]",
} as const;

/**
 * A spec value as the tables print it. Booleans read Yes/No rather than the
 * raw "true"/"false" the dashboard stores; everything else prints as entered
 * (units are already on the row label, so formatSpecValue's unit suffix would
 * double them).
 */
export function cellText(field: SpecField, raw: unknown): string {
  return field.type === "boolean" ? formatSpecValue(field, raw) : String(raw);
}

/** Table/bar min-width on phones for `n` products. */
export function mobileMinWidth(n: number): number {
  return LABEL_COL_PX.mobile + n * MOBILE_PRODUCT_MIN_PX;
}
