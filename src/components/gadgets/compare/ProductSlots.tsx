// src/components/gadgets/compare/ProductSlots.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { PlusIcon } from "./icons";
import ProductSearchBox, { ProductSearchBoxHandle } from "./ProductSearchBox";
import { Product, ProductLite } from "./types";

const slotContainerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

// Entrance only carries opacity + position now — no scale. Scale/hover
// feedback lives on the inner plain element via .brutal-press instead,
// so Framer's leftover inline transform never fights the CSS :hover
// transform (see guide §3).
const slotCardVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

export default function ProductSlots({
  maxSlots,
  slots,
  categoryProducts,
  usedSlugs,
  onPick,
  onRemove,
}: {
  maxSlots: number;
  slots: (Product | null)[];
  categoryProducts: ProductLite[];
  usedSlugs: Set<string>;
  onPick: (slotIndex: number, slug: string) => void;
  onRemove: (slotIndex: number) => void;
}) {
  const searchBoxRefs = useRef<Array<ProductSearchBoxHandle | null>>([]);

  // How many slot cards are currently visible. Starts at the minimum needed
  // to compare (2) and grows one card at a time via the "Add" button, up to
  // maxSlots. Extra slots (e.g. the 3rd) stay hidden until the user asks for
  // them. Deep links that pre-fill more slots reveal those automatically.
  const filledCount = slots.filter(Boolean).length;
  const [revealed, setRevealed] = useState(() =>
    Math.min(maxSlots, Math.max(2, filledCount))
  );

  const prevMaxRef = useRef(maxSlots);
  useEffect(() => {
    if (prevMaxRef.current !== maxSlots) {
      // Category changed (slot capacity differs) — re-hide the extra slots.
      prevMaxRef.current = maxSlots;
      setRevealed(Math.min(maxSlots, Math.max(2, filledCount)));
    } else {
      // Same category — only ever grow, to reveal newly-filled slots.
      setRevealed((r) => Math.min(maxSlots, Math.max(r, filledCount)));
    }
  }, [maxSlots, filledCount]);

  const visibleSlots = Math.min(revealed, maxSlots);

  return (
    <motion.div
      variants={slotContainerVariants}
      initial="hidden"
      animate="show"
      className="relative z-10 flex items-stretch gap-2 sm:gap-4 mb-6"
    >
      {Array.from({ length: visibleSlots }).map((_, i) => {
        const current = slots[i];
        return (
          <React.Fragment key={i}>
            {/* Outer: entrance + layout only, no hover/press props */}
            <motion.div layout variants={slotCardVariants} className="relative flex-1 min-w-0">
              {/* Inner: the actual bordered/shadowed surface + press feedback */}
              <div
                onClick={current ? undefined : () => searchBoxRefs.current[i]?.focus()}
                className={`relative rounded-none border-2 shadow-brutal-sm brutal-press p-3 sm:p-4 text-center transition-colors duration-100 ${
                  current
                    ? "border-border-heavy bg-card"
                    : "border-dashed border-border-heavy bg-card hover:bg-accent-tint cursor-pointer"
                }`}
              >
                <AnimatePresence>
                  {current && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      onClick={() => onRemove(i)}
                      aria-label={`Remove ${current.name} from comparison`}
                      className="absolute top-2 right-2 h-6 w-6 rounded-none border-2 border-border-heavy bg-card text-muted-foreground hover:bg-danger hover:text-on-danger flex items-center justify-center text-sm leading-none transition-colors duration-100"
                    >
                      ×
                    </motion.button>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {current ? (
                    <motion.div
                      key={current.slug}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      {current.image && (
                        <div className="h-14 sm:h-16 w-14 sm:w-16 mx-auto mb-2 rounded-none border-2 border-border-heavy bg-card p-1.5">
                          <img loading="lazy" decoding="async"
                            src={current.image}
                            alt={current.name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      )}
                      <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                        {current.name}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="py-4"
                    >
                      <button
                        type="button"
                        onClick={() => searchBoxRefs.current[i]?.focus()}
                        aria-label="Add a product to this slot"
                        className="mx-auto mb-2 h-10 w-10 rounded-none border-2 border-dashed border-border-heavy flex items-center justify-center text-muted-foreground hover:bg-accent-2 hover:text-on-accent-2 hover:border-solid transition-colors duration-100"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                      <p className="text-xs sm:text-sm text-muted-foreground">Add product</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <ProductSearchBox
                  ref={(el) => {
                    searchBoxRefs.current[i] = el;
                  }}
                  options={categoryProducts.filter(
                    (p) => p.slug === current?.slug || !usedSlugs.has(p.slug)
                  )}
                  onPick={(slug) => onPick(i, slug)}
                  placeholder="Search product..."
                />
              </div>
            </motion.div>

            {i < visibleSlots - 1 && (
              <AnimatePresence>
                {slots[i] && slots[i + 1] && (
                  <motion.div
                    key="vs"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex items-center justify-center shrink-0"
                  >
                    <span className="flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-none border-2 border-border-heavy bg-blue-600 text-white text-[10px] sm:text-xs font-extrabold tracking-wide">
                      VS
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </React.Fragment>
        );
      })}

      {/* Reveal the next hidden slot (e.g. the 3rd card) on demand. */}
      {visibleSlots < maxSlots && (
        <motion.button
          type="button"
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setRevealed((r) => Math.min(maxSlots, r + 1))}
          aria-label="Add another product to compare"
          className="shrink-0 self-stretch flex flex-col items-center justify-center gap-1 px-3 sm:px-4 rounded-none border-2 border-dashed border-border-heavy bg-card text-muted-foreground hover:bg-accent-2 hover:text-on-accent-2 hover:border-solid transition-colors duration-100 brutal-press"
        >
          <PlusIcon className="h-5 w-5" />
          <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">Add</span>
        </motion.button>
      )}
    </motion.div>
  );
}