import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Cpu, MemoryStick, HardDrive, Smartphone, BatteryCharging } from "lucide-react";
import Underline from "@/components/ui/Underline";
import CompareToggle from "@/components/gadgets/compare/CompareToggle";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image: string | null;
  priceFrom: number | null;
  currency: string;
  // `slug` drives the compare tray, which can only hold one category at a time.
  category: { name: string; slug: string };
  specs?: unknown;
}

/**
 * Appends `unit` only when the stored value doesn't already carry it.
 *
 * `batteryMah` is a free-text field outside phones, so watches arrive as
 * "Li-Ion 445 mAh" and earbuds as "57 mAh (buds) / 530 mAh (case)". Blindly
 * suffixing produced "Li-Ion 445 mAh mAh" on the cards.
 */
function withUnit(unit: string) {
  const has = new RegExp(`\\b${unit}\\b`, "i");
  return (v: string) => (has.test(v) ? v : `${v} ${unit}`);
}

// Key specs shown on the card, each with an icon. Only the ones a product
// actually has are rendered (max 4).
const SPEC_CHIPS: { key: string; Icon: LucideIcon; fmt?: (v: string) => string }[] = [
  { key: "chipset", Icon: Cpu },
  { key: "screenSize", Icon: Smartphone },
  { key: "ram", Icon: MemoryStick },
  { key: "storage", Icon: HardDrive },
  { key: "batteryMah", Icon: BatteryCharging, fmt: withUnit("mAh") },
];

// "unspecified" / "n/a" / "—" are how an unfilled field comes back from the
// dashboard form. They're honest in the full spec table but pure noise on a
// card that only has room for four chips. The unit is stripped first so
// "mAh unspecified" (as stored on the AirPods) is caught too.
const PLACEHOLDER_SPEC = /^(unspecified|unknown|n\/?a|none|tbd|-+|—)$/i;
const UNIT_WORDS = /\b(mah|gb|tb|mb|inch(es)?|hz|w|mm)\b/gi;

function isPlaceholderSpec(v: string): boolean {
  return PLACEHOLDER_SPEC.test(v.replace(UNIT_WORDS, "").trim());
}

function keySpecChips(specs: unknown): { Icon: LucideIcon; value: string }[] {
  const s = (specs ?? {}) as Record<string, unknown>;
  const chips: { Icon: LucideIcon; value: string }[] = [];
  for (const { key, Icon, fmt } of SPEC_CHIPS) {
    const raw = s[key];
    const v = typeof raw === "string" ? raw.trim() : typeof raw === "number" ? String(raw) : "";
    if (v && !isPlaceholderSpec(v)) chips.push({ Icon, value: fmt ? fmt(v) : v });
    if (chips.length >= 4) break;
  }
  return chips;
}

/**
 * Shared brutalist product card grid — used by the products listing and tag
 * pages. Card shows a category badge, brand, name, key specs (with icons) and
 * price.
 */
export default function ProductGrid({
  products,
  emptyLabel = "No products found.",
}: {
  products: ProductCardData[];
  emptyLabel?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-none border-2 border-border-heavy bg-card p-12 text-center text-muted-foreground shadow-brutal">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => {
        const chips = keySpecChips(p.specs);
        return (
          <Link
            key={p.id}
            href={`/product/${p.slug}`}
            className="brutal-press group flex flex-col overflow-hidden rounded-none border-2 border-border-heavy bg-card shadow-brutal-sm"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-border-heavy bg-white">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img loading="lazy" decoding="async"
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
              <span className="absolute left-2 top-2 border-2 border-border-heavy bg-accent-3 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-on-accent-3">
                {p.category.name}
              </span>

              {/* Sits over the image so picking a rival never costs a page
                  load — the whole point of the tray. */}
              <div className="absolute right-2 top-2">
                <CompareToggle
                  item={{
                    slug: p.slug,
                    name: p.name,
                    brand: p.brand,
                    image: p.image,
                    categorySlug: p.category.slug,
                  }}
                />
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col p-3">
              <p className="truncate text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">
                {p.brand}
              </p>
              <h4 className="mt-0.5 line-clamp-2 text-base font-extrabold leading-snug text-foreground">
                <Underline>{p.name}</Underline>
              </h4>

              {chips.length > 0 && (
                <div className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1.5">
                  {chips.map((c, i) => (
                    <span
                      key={i}
                      className="inline-flex min-w-0 items-center gap-1 text-[10px] font-bold text-muted-foreground"
                    >
                      <c.Icon className="h-3 w-3 shrink-0 text-accent" />
                      <span className="truncate">{c.value}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Price row */}
              <div className="mt-auto flex items-center justify-between gap-2 border-t-2 border-border pt-2.5">
                {p.priceFrom != null ? (
                  <p className="text-sm font-black text-accent">
                    {p.currency} {p.priceFrom.toLocaleString()}
                  </p>
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">See price</span>
                )}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-border-heavy bg-background text-muted-foreground transition-colors group-hover:bg-accent group-hover:text-on-accent">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
