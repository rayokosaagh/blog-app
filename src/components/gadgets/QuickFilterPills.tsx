import Link from "next/link";

/**
 * Quick-filter pill links — preset sort shortcuts rendered as brutalist
 * pills. Server component: just links, no JS. (Brand shortcuts live in the
 * sidebar's Brand dropdown, so they're not duplicated here.)
 *
 * The "Price: Low → High" / "Under Rs N" shortcuts were removed with the rest
 * of the public pricing UI; Product.priceFrom and the ?minPrice/?maxPrice and
 * ?sort=price-* handling in lib/gadgets/productFilters.ts are still in place,
 * so those pills can come straight back when pricing ships.
 */
export default function QuickFilterPills({ basePath }: { basePath: string }) {
  const pills: { label: string; href: string }[] = [
    { label: "Newest", href: basePath },
    { label: "Name (A–Z)", href: `${basePath}?sort=name` },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((p) => (
        <Link
          key={p.label}
          href={p.href}
          className="tag-pill brutal-press bg-card text-foreground transition-colors hover:bg-accent hover:text-on-accent"
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}
