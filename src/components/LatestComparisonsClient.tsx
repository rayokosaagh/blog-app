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

function ProductPortrait({ product, align }: { product: ComparisonProduct; align: "left" | "right" }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-white p-2.5 ring-1 ring-black/5 dark:ring-white/10">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-[10px] text-zinc-300">No image</span>
        )}
      </div>
      <p className="mt-3 min-h-[2.5rem] max-w-[9rem] text-center text-sm font-semibold leading-snug text-foreground line-clamp-2">
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
        className="group relative block h-full overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_16px_32px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:hover:shadow-none"
      >
        {/* Signature: a single accent bar sweeps in from the left on hover */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-accent transition-transform duration-300 ease-out group-hover:scale-x-100"
        />

        <span className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent">
          {item.category.name}
        </span>

        <div className="flex items-center justify-center gap-3">
          <ProductPortrait product={item.productA} align="left" />

          <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-[10px] font-bold tracking-wide text-muted-foreground transition-colors duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-white">
            VS
          </span>

          <ProductPortrait product={item.productB} align="right" />
        </div>

        <div className="mt-5 flex items-center justify-center gap-1.5 border-t border-border pt-4 text-xs font-medium text-muted-foreground transition-colors duration-300 group-hover:text-accent">
          <span>Compare now</span>
          <svg
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
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

export default function LatestComparisonsClient({
  comparisons,
}: {
  comparisons: ComparisonItem[];
}) {
  const shouldReduceMotion = useReducedMotion();

  // Avoid SSR/client mismatch: pin false until mounted, then read real value
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduceMotion = mounted ? !!shouldReduceMotion : false;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M8 7l4-4 4 4M8 17l4 4 4-4M12 3v18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Head-to-Head
          </span>
          <h2 className="text-lg font-bold leading-tight text-foreground">
            Latest Comparisons
          </h2>
        </div>
      </div>

      <motion.div
        variants={reduceMotion ? undefined : containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4"
      >
        {comparisons.map((c) => (
          <ComparisonCard key={c.id} item={c} reduceMotion={reduceMotion} />
        ))}
      </motion.div>
    </section>
  );
}