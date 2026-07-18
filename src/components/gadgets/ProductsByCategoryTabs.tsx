"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Underline from "../ui/Underline";
import ProductTagRail from "./ProductTagRail";
import SwapDeck from "./SwapDeck";

interface CategoryDef {
  slug: string;
  name: string;
  icon?: string;
}

interface ProductCard {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image: string | null;
  priceFrom: number | null;
  currency: string;
}

interface TagItem {
     id: string;
     name: string;
     slug: string;
     icon: string;
     colorMode?: "AUTO" | "KEEP_ORIGINAL" | "FORCE_MONO";
     _count: { products: number };
   }
interface ProductsByCategoryTabsProps {
  categories: CategoryDef[];
  productsByCategory: Record<string, ProductCard[]>;
  tags?: TagItem[];
}

const VISIBLE_COUNT = 6;

export default function ProductsByCategoryTabs({
  categories,
  productsByCategory,
  tags = [],
}: ProductsByCategoryTabsProps) {
  const [active, setActive] = useState(categories[0]?.slug ?? "");
  const [view, setView] = useState<"front" | "back">("front");
  const allProducts = productsByCategory[active] ?? [];
  const products = allProducts.slice(0, VISIBLE_COUNT);
  const hasMore = allProducts.length > VISIBLE_COUNT;

  return (
    <motion.div
      layout
      className="mb-8 bg-card border-2 border-border-heavy shadow-brutal rounded-none p-5"
    >
      <SwapDeck
        active={view}
        onToggle={() => setView((v) => (v === "front" ? "back" : "front"))}
        frontLabel="Categories"
        backLabel="Tags"
        frontTitle="Browse by Category"
        backTitle="Browse by Brands"
        front={
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const isActive = c.slug === active;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setActive(c.slug)}
                  aria-pressed={isActive}
                  className={`tag-pill brutal-press inline-flex items-center gap-1.5 ${
                    isActive
                      ? "bg-accent text-on-accent"
                      : "bg-background text-muted-foreground"
                  }`}
                >
                  {c.icon && <i className={`${c.icon} text-sm`} aria-hidden="true" />}
                  {c.name}
                </button>
              );
            })}
          </div>
        }
        back={<ProductTagRail tags={tags} />}
      />

      {/* Product grid — category view only */}
      <AnimatePresence mode="wait">
        {view === "front" && (
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mt-5"
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {products.length === 0 ? (
                <div className="col-span-full bg-background border-2 border-border-heavy rounded-none p-8 text-center text-muted-foreground">
                  No products yet in this category.
                </div>
              ) : (
                products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/product/${p.slug}`}
                    className="group flex flex-col bg-background border-2 border-border-heavy rounded-none overflow-hidden shadow-brutal-sm brutal-press"
                  >
                    <div className="aspect-square relative overflow-hidden">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-2 flex-1 flex flex-col">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                        {p.brand}
                      </p>
                      <h4 className="text-[18px] font-extrabold text-foreground mt-0.5 line-clamp-2">
                        <Underline>{p.name}</Underline>
                      </h4>
                      {p.priceFrom != null && (
                        <p className="text-[11px] font-bold text-accent mt-1">
                          {p.currency} {p.priceFrom.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-4">
                <Link
                  href={`/compare?category=${active}`}
                  className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-none border-2 border-border-heavy bg-background text-xs font-extrabold uppercase tracking-wide text-foreground shadow-brutal-sm brutal-press"
                >
                  View more products
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}