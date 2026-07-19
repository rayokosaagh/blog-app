"use client";

import type { LucideIcon } from "lucide-react";
import {
  Share2,
  Calendar,
  Smartphone,
  Monitor,
  Cpu,
  MemoryStick,
  BatteryCharging,
  HardDrive,
  Layers,
  Palette,
  DollarSign,
  Eye,
  MessageSquare,
  Repeat2,
  Images,
} from "lucide-react";
import TagIcon from "@/components/blog/TagIcon";
import ProductGallery from "./ProductGallery";

// Icons must be resolved *inside* this client component — a Server Component
// (page.tsx) cannot pass a component reference (a function) as a prop, only
// plain serializable data. So the server passes a string key like "calendar",
// and this map turns it into the real icon.
const ICONS = {
  calendar: Calendar,
  smartphone: Smartphone,
  monitor: Monitor,
  cpu: Cpu,
  memoryStick: MemoryStick,
  batteryCharging: BatteryCharging,
  hardDrive: HardDrive,
  layers: Layers,
  palette: Palette,
  dollarSign: DollarSign,
  eye: Eye,
  messageSquare: MessageSquare,
  repeat: Repeat2,
  images: Images,
} as const satisfies Record<string, LucideIcon>;

export type HeroIconKey = keyof typeof ICONS;

export interface HeroMetaItem {
  icon: HeroIconKey;
  text: string;
}

export interface HeroStat {
  icon: HeroIconKey;
  value: string;
  label: string;
}

export interface HeroQuickSpec {
  icon: HeroIconKey;
  value: string;
  unit?: string;
  label: string;
}

export interface HeroTab {
  icon: HeroIconKey;
  label: string;
  href: string;
}

interface ProductHeroProps {
  product: {
    name: string;
    brand: string;
    image: string | null;
    images?: string[];
    priceFrom: number | null;
    currency: string;
    tags: { id: string; name: string; slug: string; icon: string }[];
  };
  categoryName: string;
  /** Bullet list under the brand — release date, storage, OS, colors, dimensions, etc. */
  meta?: HeroMetaItem[];
  /** Extra highlight blocks (e.g. views/fans once you track them). Price is added automatically. */
  stats?: HeroStat[];
  /** The 4-across quick-glance strip — screen size, camera, RAM, battery. */
  quickSpecs?: HeroQuickSpec[];
  /** Bottom tab row — Review / Opinions / Compare / Pictures / Prices. */
  tabs?: HeroTab[];
  onShare?: () => void;
}

export default function ProductHero({
  product,
  categoryName,
  meta = [],
  stats = [],
  quickSpecs = [],
  tabs = [],
  onShare,
}: ProductHeroProps) {
  const priceStat: HeroStat[] =
    product.priceFrom != null
      ? [
          {
            icon: "dollarSign",
            value: `${product.currency} ${product.priceFrom.toLocaleString()}`,
            label: "Starting At",
          },
        ]
      : [];
  const allStats = [...priceStat, ...stats];

  // Main image + any extra gallery images, primary first, de-duplicated.
  const galleryImages = Array.from(
    new Set(
      [product.image, ...(product.images ?? [])].filter(
        (u): u is string => typeof u === "string" && u.trim() !== ""
      )
    )
  );

  return (
    <div className="border-2 border-border-heavy bg-card shadow-brutal-lg rounded-none">
      {/* Title bar */}
      <div className="flex items-center justify-between gap-4 border-b-4 border-border-heavy bg-foreground px-6 py-4 sm:px-8">
        <div className="min-w-0">
          <span className="tag-pill inline-flex bg-accent-3 text-on-accent-3 mb-2">
            {categoryName}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-background tracking-tight truncate">
            {product.name}
          </h1>
        </div>

        {onShare && (
          <button
            type="button"
            onClick={onShare}
            aria-label="Share this product"
            className="shrink-0 p-2 rounded-none border-2 border-transparent text-background hover:text-on-accent-2 hover:bg-accent-2 hover:border-border-heavy transition-colors duration-100"
          >
            <Share2 size={18} />
          </button>
        )}
      </div>

      <div className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Product gallery — main image + arrows + thumbnail rail */}
          <ProductGallery images={galleryImages} alt={product.name} />

          {/* Meta bullets + brand */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
              {product.brand}
            </p>

            {meta.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2.5">
                {meta.map((m, i) => {
                  const Icon = ICONS[m.icon];
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-2.5 text-sm font-bold text-foreground"
                    >
                      <span className="shrink-0 flex items-center justify-center w-6 h-6 border-2 border-border-heavy bg-accent-tint">
                        <Icon size={13} />
                      </span>
                      {m.text}
                    </li>
                  );
                })}
              </ul>
            )}

            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {product.tags.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1.5 border-2 border-border-heavy bg-background rounded-none px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-foreground"
                  >
                    <TagIcon icon={t.icon} className="w-3.5 h-3.5 [&>svg]:w-full [&>svg]:h-full" />
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stat blocks — price (always, if set) + any passed-in stats (views/fans, etc.) */}
          {allStats.length > 0 && (
            <div className="flex sm:flex-col gap-3 justify-center sm:w-44 shrink-0">
              {allStats.map((s, i) => {
                const Icon = ICONS[s.icon];
                return (
                  <div
                    key={i}
                    className="flex-1 sm:flex-none border-2 border-border-heavy bg-accent-2 text-on-accent-2 shadow-brutal-sm rounded-none px-4 py-3 flex flex-col items-center justify-center text-center"
                  >
                    <Icon size={18} className="mb-1" />
                    <p className="text-lg font-black leading-tight">{s.value}</p>
                    <p className="text-[10px] font-extrabold uppercase tracking-wide">
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick-spec strip */}
        {quickSpecs.length > 0 && (
          <div className="mt-6 border-2 border-border-heavy grid grid-cols-2 sm:grid-cols-4 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-border">
            {quickSpecs.map((q, i) => {
              const Icon = ICONS[q.icon];
              return (
                <div key={i} className="flex flex-col items-center justify-center gap-1 px-3 py-4 text-center">
                  <Icon size={20} className="text-accent mb-1" />
                  <p className="text-base font-black text-foreground leading-none">
                    {q.value}
                    {q.unit && (
                      <span className="text-xs font-bold text-muted-foreground ml-0.5">
                        {q.unit}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">
                    {q.label}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom tab nav — text-only links with no shadow, so they get the
          brutal-invert flat color-block hover instead of a fade. */}
      {tabs.length > 0 && (
        <div className="border-t-4 border-border-heavy grid grid-cols-3 sm:grid-cols-5 divide-x-2 divide-border">
          {tabs.map((t, i) => {
            const Icon = ICONS[t.icon];
            return (
              <a
                key={i}
                href={t.href}
                className="brutal-invert flex items-center justify-center gap-1.5 py-3 text-[11px] font-extrabold uppercase tracking-wide text-foreground"
              >
                <Icon size={14} />
                {t.label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}