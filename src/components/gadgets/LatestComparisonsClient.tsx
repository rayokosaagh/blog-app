"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";

interface ComparisonProduct {
  slug: string;
  name: string;
  image: string | null;
}

interface ComparisonItem {
  id: string;
  category: { slug: string; name: string };
  productA: ComparisonProduct;
  productB: ComparisonProduct;
}

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.03 },
  },
};

const cardEntranceVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

// Tween, not spring — springs are reserved for position-only moving
// indicators, not routine content reveals. Matches cardEntranceVariants'
// curve so the mobile and desktop layouts feel like one system.
const rowEntranceVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

function ProductPortrait({ product }: { product: ComparisonProduct }) {
  return (
    <div className="flex flex-col items-center">
      {/* bg-white is deliberate, not a hardcode oversight: product photos are
          shot on white, and framing them in the near-black dark-mode --card
          color would make them look broken rather than themed. Promote to
          a --color-product-frame token if this pattern keeps showing up. */}
      <div className="flex h-24 w-24 items-center justify-center rounded-none bg-white p-2.5 border-2 border-border-heavy">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-[10px] text-muted-foreground">No image</span>
        )}
      </div>
      <p className="mt-3 min-h-[2.5rem] max-w-[9rem] text-center text-sm font-bold leading-snug text-foreground line-clamp-2">
        {product.name}
      </p>
    </div>
  );
}

function ComparisonCard({
  item,
  reduceMotion,
}: {
  item: ComparisonItem;
  reduceMotion: boolean;
}) {
  return (
    <motion.div variants={reduceMotion ? undefined : cardEntranceVariants} className="h-full">
      <Link
        href={`/compare?category=${item.category.slug}&p1=${item.productA.slug}&p2=${item.productB.slug}`}
        className="group relative block h-full overflow-hidden rounded-none border-2 border-border-heavy bg-card p-6 shadow-brutal brutal-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {/* Signature: a single accent bar sweeps in from the left on hover */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-accent transition-transform duration-200 ease-out group-hover:scale-x-100"
        />

        <span className="tag-pill mb-4 inline-flex bg-accent text-on-accent">
          {item.category.name}
        </span>

        <div className="flex items-center justify-center gap-3">
          <ProductPortrait product={item.productA} />

          {/* VS badge gets its own identity via --accent-2 (permanently on,
              not just on hover) so it reads as a distinct fixture rather
              than competing with the primary accent used on the category
              pill and hover sweep. Scales up slightly on hover for feedback
              instead of a color swap, since the color is already "on". */}
          <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-none border-2 border-border-heavy bg-accent-2 text-[10px] font-bold tracking-wide text-on-accent-2 shadow-brutal-sm transition-transform duration-150 ease-out group-hover:scale-110">
            VS
          </span>

          <ProductPortrait product={item.productB} />
        </div>

        <div className="mt-5 flex items-center justify-center gap-1.5 border-t-2 border-border pt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground transition-colors duration-100 group-hover:text-accent">
          <span>Compare now</span>
          <svg
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}

// Compact horizontal row used on small screens: two thumbnails + VS badge on the
// left, category/product names in the middle, chevron on the right. Reads as
// one continuous list inside a single card, so it gets the list-row-hover
// treatment (bg-accent-tint) rather than its own card/press styling.
function ComparisonRow({
  item,
  isLast,
  reduceMotion,
}: {
  item: ComparisonItem;
  isLast: boolean;
  reduceMotion: boolean;
}) {
  return (
    <motion.div variants={reduceMotion ? undefined : rowEntranceVariants}>
      <Link
        href={`/compare?category=${item.category.slug}&p1=${item.productA.slug}&p2=${item.productB.slug}`}
        className={`group flex items-center gap-3 rounded-none py-3 px-2 -mx-2 transition-colors duration-100 hover:bg-accent-tint focus-visible:bg-accent-tint focus-visible:outline-none ${
          !isLast ? "border-b-2 border-border" : ""
        }`}
      >
        {/* Overlapping thumbnail pair + VS badge */}
        <div className="relative flex shrink-0 items-center">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-none bg-white border-2 border-border-heavy">
            {item.productA.image ? (
              <img src={item.productA.image} alt={item.productA.name} className="h-full w-full object-contain" />
            ) : (
              <span className="text-[8px] text-muted-foreground">No image</span>
            )}
          </div>
          {/* Same accent-2 treatment as the card VS badge, kept permanently
              on so the mobile row list carries the same visual language. */}
          <span className="relative z-10 -mx-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-none border-2 border-card bg-accent-2 text-[9px] font-bold tracking-wide text-on-accent-2 transition-transform duration-150 ease-out group-hover:scale-110">
            VS
          </span>
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-none bg-white border-2 border-border-heavy">
            {item.productB.image ? (
              <img src={item.productB.image} alt={item.productB.name} className="h-full w-full object-contain" />
            ) : (
              <span className="text-[8px] text-muted-foreground">No image</span>
            )}
          </div>
        </div>

        {/* Text block */}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-accent">{item.category.name}</p>
          <p className="mt-0.5 truncate text-sm font-bold text-foreground">
            {item.productA.name} <span className="text-muted-foreground">vs</span> {item.productB.name}
          </p>
        </div>

        {/* Chevron */}
        <svg
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </motion.div>
  );
}

export default function LatestComparisonsClient({
  comparisons,
}: {
  comparisons: ComparisonItem[];
}) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduceMotion = mounted ? !!shouldReduceMotion : false;

  return (
    <section className="w-full">
      <div className="mb-6 flex items-center gap-3 pb-4 border-b-2 border-border-heavy">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-none border-2 border-border-heavy bg-accent shadow-brutal-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-on-accent">
            <path d="M8 7l4-4 4 4M8 17l4 4 4-4M12 3v18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-accent">
            {/* Static square indicator — a looping ping animation is exactly
                the kind of continuous idle-loop motion the system removes. */}
            <span className="inline-flex h-1.5 w-1.5 rounded-none bg-accent" />
            Head-to-Head
          </span>
          <h2 className="text-lg font-extrabold leading-tight text-foreground">
            Latest Comparisons
          </h2>
        </div>
      </div>

      {/* Mobile: compact row list inside a single card */}
      <motion.div
        variants={reduceMotion ? undefined : containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="sm:hidden rounded-none border-2 border-border-heavy bg-card shadow-brutal p-4"
      >
        {comparisons.map((c, i) => (
          <ComparisonRow key={c.id} item={c} isLast={i === comparisons.length - 1} reduceMotion={reduceMotion} />
        ))}
      </motion.div>

      {/* Tablet / desktop: existing card grid, untouched */}
      <motion.div
        variants={reduceMotion ? undefined : containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="hidden sm:grid grid-cols-2 gap-6 lg:grid-cols-4"
      >
        {comparisons.map((c) => (
          <ComparisonCard key={c.id} item={c} reduceMotion={reduceMotion} />
        ))}
      </motion.div>
    </section>
  );
}