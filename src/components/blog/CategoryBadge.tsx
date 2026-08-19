import Link from "next/link";
import { getPostCategory } from "@/lib/blog/categories";

// Accent token → utility pair. Written out so Tailwind sees the class names.
const ACCENT_CLASSES = {
  accent: "bg-accent text-on-accent",
  "accent-2": "bg-accent-2 text-on-accent-2",
  "accent-3": "bg-accent-3 text-on-accent-3",
} as const;

/**
 * The small "REVIEW" / "NEWS" chip that tells a reader what kind of article
 * they're looking at, before the headline does. Links to the category page.
 *
 * Server-safe (no hooks); usable inside client components too. `size="sm"`
 * is for card corners, the default for the article header.
 */
export default function CategoryBadge({
  category,
  size = "md",
  className = "",
  /** Render as a plain span (e.g. inside another <a>) instead of a link. */
  asSpan = false,
}: {
  category: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
  asSpan?: boolean;
}) {
  const def = getPostCategory(category);
  const Icon = def.Icon;
  const classes = `inline-flex items-center gap-1 border-[1.5px] border-border-heavy font-extrabold uppercase tracking-widest ${
    ACCENT_CLASSES[def.accent]
  } ${size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"} ${className}`;

  const inner = (
    <>
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={2.5} />
      {def.singular}
    </>
  );

  if (asSpan) return <span className={classes}>{inner}</span>;
  return (
    <Link href={`/${def.slug}`} className={`${classes} transition-transform duration-150 hover:-translate-y-0.5`}>
      {inner}
    </Link>
  );
}
