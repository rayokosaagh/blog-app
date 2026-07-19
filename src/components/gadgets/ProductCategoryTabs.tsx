import Link from "next/link";

interface CategoryTab {
  slug: string;
  name: string;
  icon?: string;
}

/**
 * Category tabs for the products page: bold brutalist tiles (icon box + name)
 * that switch the listing category. Server component — plain links to
 * `${basePath}?category=<slug>` (and "All" → basePath).
 */
export default function ProductCategoryTabs({
  categories,
  active,
  basePath = "/products",
  tag,
}: {
  categories: CategoryTab[];
  active?: string;
  basePath?: string;
  /** Preserve an active tag context when switching category. */
  tag?: string;
}) {
  const tabs: CategoryTab[] = [{ slug: "", name: "All", icon: "bi bi-grid-fill" }, ...categories];
  const tagQs = tag ? `tag=${encodeURIComponent(tag)}` : "";

  return (
    <div className="scrollbar-hide -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
      {tabs.map((t) => {
        const isActive = (t.slug || "") === (active || "");
        const catQs = t.slug ? `category=${t.slug}` : "";
        const qs = [catQs, tagQs].filter(Boolean).join("&");
        const href = qs ? `${basePath}?${qs}` : basePath;
        return (
          <Link
            key={t.slug || "all"}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`brutal-press group inline-flex shrink-0 items-center gap-2.5 rounded-none border-2 border-border-heavy py-1.5 pl-1.5 pr-4 text-sm font-extrabold uppercase tracking-wide shadow-brutal-sm transition-colors duration-100 ${
              isActive
                ? "bg-accent text-on-accent"
                : "bg-card text-foreground hover:bg-accent-tint"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 border-border-heavy transition-colors ${
                isActive ? "bg-background text-foreground" : "bg-accent-2 text-on-accent-2"
              }`}
            >
              {t.icon ? (
                <i className={`${t.icon} text-base`} aria-hidden="true" />
              ) : (
                <span className="text-xs">{t.name.charAt(0)}</span>
              )}
            </span>
            {t.name}
          </Link>
        );
      })}
    </div>
  );
}
