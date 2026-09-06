import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

/**
 * Shared empty state.
 *
 * Deliberately has no "use client" and no framer-motion: it is rendered from
 * server components (ProductGrid, ProductListing) as well as client ones, and
 * a client boundary here would pull the whole public catalogue into the
 * bundle for what is a static message.
 *
 * Two variants, both lifted from states that already existed rather than
 * invented: "soft" matches the dashboard chrome (rounded-2xl + ring), "brutal"
 * matches the public neo-brutalist chrome (heavy border + hard shadow).
 *
 * Pass frame={false} when the caller already supplies the surrounding card —
 * a table cell, or an animated wrapper.
 */

type EmptyStateAction = {
  href: string;
  label: string;
};

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  variant?: "soft" | "brutal";
  frame?: boolean;
  className?: string;
};

const styles = {
  soft: {
    frame: "bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800",
    tile: "h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10",
    icon: "h-6 w-6 text-blue-600 dark:text-blue-400",
    title: "text-base font-semibold text-zinc-900 dark:text-zinc-50",
    description: "text-sm text-zinc-500 dark:text-zinc-400 mt-1",
    action:
      "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium mt-2 inline-block",
  },
  brutal: {
    frame: "bg-card border-2 border-border-heavy rounded-none shadow-brutal",
    tile: "h-14 w-14 rounded-none border-2 border-border-heavy bg-accent-tint",
    icon: "h-6 w-6 text-foreground",
    title: "text-lg font-bold text-foreground",
    description: "text-sm text-muted-foreground mt-1",
    action:
      "inline-flex items-center gap-2 mt-4 px-5 py-2.5 border-2 border-border-heavy rounded-none bg-accent text-on-accent shadow-brutal-sm brutal-press font-extrabold uppercase tracking-wide text-xs",
  },
} as const;

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "soft",
  frame = true,
  className,
}: EmptyStateProps) {
  const s = styles[variant];

  return (
    <div className={twMerge("p-12 text-center", frame && s.frame, className)}>
      <div className={twMerge("mx-auto mb-4 flex items-center justify-center", s.tile)}>
        <Icon className={s.icon} strokeWidth={2} />
      </div>
      <p className={s.title}>{title}</p>
      {description && <p className={s.description}>{description}</p>}
      {action && (
        <Link href={action.href} className={s.action}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

/**
 * Table-cell wrapper. Renders the state inside a full-width <td> with no card
 * chrome of its own, so it does not double up on the table's borders.
 */
export function EmptyStateRow({
  colSpan,
  ...props
}: EmptyStateProps & { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <EmptyState {...props} frame={false} />
      </td>
    </tr>
  );
}
