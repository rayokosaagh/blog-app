import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { POST_CATEGORIES } from "@/lib/blog/categories";

/**
 * The "All · News · Reviews · Versus · Deals · Guides" strip at the top of
 * every article listing. Plain links — each tab is a real page (/blog, /news,
 * /reviews…) with its own canonical, so a crawler and a reader without JS both
 * get the same set of URLs. Filters and sort live on those pages, so a tab
 * switch deliberately drops them: "Reviews sorted by most read" is a fine
 * URL, but carrying a tag filter from News into Guides usually yields nothing.
 */
export default function CategoryTabs({
  activeSlug,
  counts,
}: {
  /** Slug of the current category page, or undefined on /blog (All). */
  activeSlug?: string;
  /** Optional published-post counts per category key, shown as a small number. */
  counts?: Partial<Record<string, number>>;
}) {
  const tabs = [
    { slug: undefined as string | undefined, href: "/blog", label: "All", Icon: LayoutGrid, count: undefined as number | undefined },
    ...POST_CATEGORIES.map((c) => ({
      slug: c.slug,
      href: `/${c.slug}`,
      label: c.label,
      Icon: c.Icon,
      count: counts?.[c.key],
    })),
  ];

  return (
    <nav aria-label="Article categories" className="mt-8 -mx-6 px-6 overflow-x-auto">
      <ul className="flex items-center gap-2 min-w-max">
        {tabs.map((t) => {
          const active = t.slug === activeSlug;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 surface-pill border-border-heavy px-4 py-2 text-xs font-extrabold uppercase tracking-wide transition-colors brutal-press ${
                  active
                    ? "bg-accent text-on-accent shadow-brutal-sm"
                    : "bg-card text-muted-foreground hover:bg-accent hover:text-on-accent"
                }`}
              >
                <t.Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                {t.label}
                {typeof t.count === "number" && (
                  <span
                    className={`ml-0.5 tabular-nums text-[10px] ${
                      active ? "opacity-80" : "text-muted-foreground/70"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
