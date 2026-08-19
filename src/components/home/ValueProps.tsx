import { Star, Zap, Tag, Users, type LucideIcon } from "lucide-react";

const PROPS: { Icon: LucideIcon; title: string; body: string }[] = [
  { Icon: Star, title: "Curated Content", body: "Only the most relevant stories, handpicked daily." },
  { Icon: Zap, title: "Real Opinions", body: "In-depth reviews and honest comparisons." },
  { Icon: Tag, title: "Best Deals", body: "Price drops and offers worth your money." },
  { Icon: Users, title: "For Everyone", body: "From tech geeks to casual buyers — we've got you." },
];

const DIVIDERS = [
  "",
  "border-t sm:border-t-0 sm:border-l",
  "border-t lg:border-t-0 lg:border-l",
  "border-t sm:border-l lg:border-t-0",
];

/**
 * The four-up "why this site" strip under Top Stories: one bordered band,
 * hairline-divided, each cell an icon tile + title + one line. Static copy —
 * it's the publication's own promise, not data.
 */
export default function ValueProps() {
  return (
    <ul className="grid overflow-hidden surface-border border-border-heavy bg-card shadow-brutal-sm sm:grid-cols-2 lg:grid-cols-4">
      {PROPS.map(({ Icon, title, body }, i) => (
        <li
          key={title}
          // Hairlines between cells for a 1 / 2 / 4-column band: stacked
          // (top rules), two-up (left rule on the 2nd column, top rule on the
          // 2nd row), four-up (left rules only). Written per index so no cell
          // gets both a border-t and a border-t-0 at the same breakpoint.
          className={`flex items-center gap-4 border-border px-6 py-5 ${DIVIDERS[i]}`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center surface-border border-border-heavy bg-accent-tint text-accent">
            <Icon className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-extrabold text-foreground">{title}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{body}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
