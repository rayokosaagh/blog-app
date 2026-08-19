import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

const CHIP: Record<"accent" | "accent-2" | "accent-3", string> = {
  accent: "bg-accent text-on-accent",
  "accent-2": "bg-accent-2 text-on-accent-2",
  "accent-3": "bg-accent-3 text-on-accent-3",
};
const HOVER: Record<"accent" | "accent-2" | "accent-3", string> = {
  accent: "hover:bg-accent hover:text-on-accent",
  "accent-2": "hover:bg-accent-2 hover:text-on-accent-2",
  "accent-3": "hover:bg-accent-3 hover:text-on-accent-3",
};

/**
 * The one section header for the homepage (and anywhere else a section
 * needs introducing): icon chip · eyebrow · title · subtitle, with an
 * optional "see all" pill on the right, over a heavy rule.
 *
 * Type comes from the heading-role tokens, not from Tailwind size classes:
 * the title is `.h-section` and the eyebrow `.h-eyebrow`, so an admin retunes
 * every section header at once from Dashboard → UI settings → Heading
 * typography (size, weight, tracking, case, face — per theme). Nothing here
 * hardcodes a font or size, which is exactly what made the old headers drift.
 *
 * `as` sets the heading LEVEL only (document outline); it never changes the
 * look. Top-level homepage sections are h2; columns inside one are h3.
 */
export default function SectionHeader({
  as: Tag = "h2",
  id,
  Icon,
  eyebrow,
  title,
  subtitle,
  action,
  accent = "accent",
  className = "",
}: {
  as?: "h2" | "h3";
  id?: string;
  Icon: LucideIcon;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  accent?: "accent" | "accent-2" | "accent-3";
  className?: string;
}) {
  return (
    <div
      className={`mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b-2 border-border-heavy pb-4 ${className}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center surface-border border-border-heavy shadow-brutal-sm ${CHIP[accent]}`}
        >
          <Icon className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          {eyebrow && (
            <span className="h-eyebrow inline-flex items-center gap-1.5 text-accent">
              <span aria-hidden className="inline-flex h-1.5 w-1.5 rounded-none bg-accent" />
              {eyebrow}
            </span>
          )}
          <Tag id={id} className="h-section text-foreground">
            {title}
          </Tag>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      {action && (
        <Link
          href={action.href}
          className={`group ml-auto inline-flex shrink-0 items-center gap-1.5 surface-pill border-border-heavy bg-card px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-foreground shadow-brutal-sm brutal-press ${HOVER[accent]}`}
        >
          {action.label}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
