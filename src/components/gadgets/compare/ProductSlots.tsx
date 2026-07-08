// src/components/gadgets/compare/ProductSlots.tsx
"use client";
import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusIcon } from "./icons";
import ProductSearchBox, { ProductSearchBoxHandle } from "./ProductSearchBox";
import { Product, ProductLite } from "./types";

const slotContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const slotCardVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
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
  // Refs live here since focus-on-click only ever targets the search box
  // of the very same slot that was clicked — no parent needs to reach in.
  const searchBoxRefs = useRef<Array<ProductSearchBoxHandle | null>>([]);

  return (
    <motion.div
      variants={slotContainerVariants}
      initial="hidden"
      animate="show"
      className="relative z-10 flex items-stretch gap-2 sm:gap-4 mb-6"
    >
      {Array.from({ length: maxSlots }).map((_, i) => {
        const current = slots[i];
        return (
          <React.Fragment key={i}>
            <motion.div
              layout
              variants={slotCardVariants}
              whileHover={{ y: -4, scale: 1.015, transition: { type: "spring", stiffness: 300, damping: 20 } }}
              whileTap={{ scale: 0.98 }}
              transition={{ layout: { type: "spring", stiffness: 300, damping: 28 } }}
              onClick={current ? undefined : () => searchBoxRefs.current[i]?.focus()}
              className={`relative flex-1 min-w-0 rounded-2xl border p-3 sm:p-4 text-center transition-colors ${
                current
                  ? "border-border bg-card"
                  : "border-2 border-dashed border-border bg-black/[0.02] dark:bg-white/[0.02] hover:border-accent/50 cursor-pointer"
              }`}
            >
              <AnimatePresence>
                {current && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    whileHover={{ scale: 1.15, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onRemove(i)}
                    aria-label={`Remove ${current.name} from comparison`}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-border/30 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 flex items-center justify-center text-sm leading-none"
                  >
                    ×
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {current ? (
                  <motion.div
                    key={current.slug}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25 }}
                  >
                    {current.image && (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="h-14 sm:h-16 w-14 sm:w-16 mx-auto mb-2 rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                      >
                        <img
                          src={current.image}
                          alt={current.name}
                          className="h-full w-full object-contain"
                        />
                      </motion.div>
                    )}
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                      {current.name}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-4"
                  >
                    <motion.button
                      type="button"
                      onClick={() => searchBoxRefs.current[i]?.focus()}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      aria-label="Add a product to this slot"
                      className="mx-auto mb-2 h-10 w-10 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-accent hover:text-accent"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </motion.button>
                    <p className="text-xs sm:text-sm text-muted-foreground">Add product</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <ProductSearchBox
                ref={(el) => (searchBoxRefs.current[i] = el)}
                options={categoryProducts.filter(
                  (p) => p.slug === current?.slug || !usedSlugs.has(p.slug)
                )}
                onPick={(slug) => onPick(i, slug)}
                placeholder="Search product..."
              />
            </motion.div>

            {i < maxSlots - 1 && (
              <AnimatePresence>
                {slots[i] && slots[i + 1] && (
                  <motion.div
                    key="vs"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ type: "spring", stiffness: 400, damping: 24 }}
                    className="flex items-center justify-center shrink-0"
                  >
                    <span className="flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-border/30 text-[10px] sm:text-xs font-bold tracking-wide text-muted-foreground">
                      VS
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </React.Fragment>
        );
      })}
    </motion.div>
  );
}