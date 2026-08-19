"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Repeat } from "lucide-react";

interface SwapProductCard {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image: string | null;
  priceFrom: number | null;
  currency: string;
  categorySlug: string; // used to build the compare link
}

interface FeaturedSwapCardProps {
  cardA: SwapProductCard;
  cardB: SwapProductCard;
}

export default function FeaturedSwapCard({ cardA, cardB }: FeaturedSwapCardProps) {
  const [frontIsA, setFrontIsA] = useState(true);

  return (
    <div className="relative w-full max-w-sm h-[420px]">
      <StackedCard product={cardA} isFront={frontIsA} />
      <StackedCard product={cardB} isFront={!frontIsA} />

      <button
        type="button"
        onClick={() => setFrontIsA((v) => !v)}
        aria-label="Swap featured product"
        className="absolute -bottom-5 -right-5 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-accent text-on-accent border-2 border-border-heavy shadow-brutal-sm hover:scale-105 active:scale-95 transition-transform"
      >
        <motion.span
          key={frontIsA ? "a" : "b"}
          initial={{ rotate: 0 }}
          animate={{ rotate: 180 }}
          transition={{ duration: 0.3 }}
          className="flex"
        >
          <Repeat className="w-5 h-5" />
        </motion.span>
      </button>
    </div>
  );
}

function StackedCard({
  product,
  isFront,
}: {
  product: SwapProductCard;
  isFront: boolean;
}) {
  return (
    <motion.div
      className={`absolute inset-0 bg-card border-2 border-border-heavy overflow-hidden ${
        isFront ? "shadow-brutal" : "shadow-brutal-sm"
      }`}
      style={{ zIndex: isFront ? 2 : 1 }}
      animate={{
        x: isFront ? 0 : 18,
        y: isFront ? 0 : 18,
        rotate: isFront ? 0 : 4,
        scale: isFront ? 1 : 0.96,
        opacity: isFront ? 1 : 0.75,
      }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <ProductCardContent product={product} interactive={isFront} />
    </motion.div>
  );
}

function ProductCardContent({
  product,
  interactive,
}: {
  product: SwapProductCard;
  interactive: boolean;
}) {
  return (
    <Link
      href={`/compare?category=${product.categorySlug}&p1=${product.slug}`}
      className="flex flex-col h-full"
      tabIndex={interactive ? 0 : -1}
      aria-hidden={!interactive}
    >
      <div className="aspect-square bg-background relative overflow-hidden">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img loading="lazy" decoding="async"
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col justify-center">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {product.brand}
        </p>
        <h4 className="text-base font-extrabold text-foreground mt-0.5 line-clamp-2">
          {product.name}
        </h4>
      </div>
    </Link>
  );
}