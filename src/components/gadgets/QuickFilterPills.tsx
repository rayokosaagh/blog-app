import Link from "next/link";

/**
 * Quick-filter pill links — preset sort/price shortcuts rendered as brutalist
 * pills. Server component: just links, no JS. (Brand shortcuts live in the
 * sidebar's Brand dropdown, so they're not duplicated here.)
 */
export default function QuickFilterPills({ basePath }: { basePath: string }) {
  const pills: { label: string; href: string }[] = [
    { label: "Newest", href: basePath },
    { label: "Price: Low → High", href: `${basePath}?sort=price-asc` },
    { label: "Under Rs 25K", href: `${basePath}?maxPrice=25000` },
    { label: "Under Rs 50K", href: `${basePath}?maxPrice=50000` },
    { label: "Under Rs 100K", href: `${basePath}?maxPrice=100000` },
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
