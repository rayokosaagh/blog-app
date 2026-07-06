"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
  type Variants,
} from "framer-motion";

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
    transition: { staggerChildren: 0.09, delayChildren: 0.04 },
  },
};

const cardEntranceVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.93, rotate: -1.5, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
};

// Hover variants — propagate down from the card's whileHover="hover"
const categoryVariants: Variants = {
  rest: { x: 0 },
  hover: { x: 2 },
};
const productAVariants: Variants = {
  rest: { scale: 1, rotate: 0, y: 0 },
  hover: { scale: 1.06, rotate: -3, y: -4 },
};
const productBVariants: Variants = {
  rest: { scale: 1, rotate: 0, y: 0 },
  hover: { scale: 1.06, rotate: 3, y: -4 },
};
// VS badge pops up on hover instead of spinning
const vsBadgeVariants: Variants = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.18, y: -3 },
};
const ctaVariants: Variants = {
  rest: { opacity: 0, y: 6 },
  hover: { opacity: 1, y: 0 },
};
const arrowVariants: Variants = {
  rest: { x: 0 },
  hover: { x: 4 },
};

function ComparisonCard({
  item,
  reduceMotion,
}: {
  item: ComparisonItem;
  reduceMotion: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Cursor position (0–100%), drives tilt + spotlight
  const mx = useMotionValue(50);
  const my = useMotionValue(50);

  const springConfig = { stiffness: 200, damping: 20, mass: 0.5 };
  const rotateX = useSpring(useTransform(my, [0, 100], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mx, [0, 100], [-8, 8]), springConfig);

  const spotlight = useMotionTemplate`radial-gradient(260px circle at ${mx}% ${my}%, rgba(37,99,235,0.14), transparent 75%)`;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set(((e.clientX - rect.left) / rect.width) * 100);
    my.set(((e.clientY - rect.top) / rect.height) * 100);
  }

  function handleMouseLeave() {
    mx.set(50);
    my.set(50);
  }

  // Spin only while hovered
  const spinClass = reduceMotion ? "" : "group-hover:animate-[spin_2.2s_linear_infinite]";

  // Comet gradient only makes sense while spinning; static ring for reduced motion
  const ringGradient = reduceMotion
    ? "conic-gradient(from 0deg, #3b82f6, #22c55e, #818cf8, #3b82f6)"
    : "conic-gradient(from 0deg, transparent 0%, #3b82f6 6%, #22c55e 16%, #818cf8 26%, transparent 42%, transparent 100%)";

  return (
    <motion.div
      variants={reduceMotion ? undefined : cardEntranceVariants}
      className="group relative h-full"
      style={{ perspective: 1000 }}
    >
      {/* Gradient ring — real DOM box (not SVG) so it matches the card's
          actual corners. Sits behind the card; the opaque card on top
          covers everything but a thin edge, like a border. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-2 overflow-hidden rounded-[20px] opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-70"
      >
        <div
          className={`absolute inset-[-50%] ${spinClass}`}
          style={{ background: ringGradient }}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[2px] overflow-hidden rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        <div
          className={`absolute inset-[-50%] ${spinClass}`}
          style={{ background: ringGradient }}
        />
      </div>

      <Link
        href={`/compare?category=${item.category.slug}&p1=${item.productA.slug}&p2=${item.productB.slug}`}
        className="relative block h-full w-full focus-visible:outline-none"
      >
        <motion.div
          ref={cardRef}
          initial="rest"
          whileHover="hover"
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX: reduceMotion ? 0 : rotateX,
            rotateY: reduceMotion ? 0 : rotateY,
            transformStyle: "preserve-3d",
          }}
          className="relative z-10 flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow duration-300 group-hover:shadow-[0_24px_50px_rgb(0,0,0,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:shadow-none dark:group-hover:border-blue-500/30"
        >
          {/* Cursor spotlight */}
          {!reduceMotion && (
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: spotlight }}
            />
          )}

          <div className="relative z-10" style={{ transform: "translateZ(24px)" }}>
            <motion.span
              variants={reduceMotion ? undefined : categoryVariants}
              className="mb-4 inline-block text-xs font-medium text-blue-600 dark:text-blue-400"
            >
              {item.category.name}
            </motion.span>

            <div
              className="relative mx-auto flex w-full shrink-0 items-center justify-center overflow-hidden rounded-xl"
              style={{ height: 112 }}
            >
              {item.productA.image && (
                <motion.img
                  src={item.productA.image}
                  alt={item.productA.name}
                  variants={reduceMotion ? undefined : productAVariants}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="rounded-xl"
                  style={{
                    maxHeight: "112px",
                    maxWidth: "85%",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                  }}
                />
              )}
            </div>

            <p className="mt-4 flex min-h-[2.6rem] items-center justify-center px-1 text-center text-sm font-semibold leading-snug text-foreground line-clamp-2">
              {item.productA.name}
            </p>

            {/* VS divider — badge pops on hover */}
            <div className="relative my-3 flex items-center justify-center">
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
              <motion.span
                variants={reduceMotion ? undefined : vsBadgeVariants}
                transition={{ type: "spring", stiffness: 300, damping: 12 }}
                className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white shadow-[0_0_0_4px_rgba(37,99,235,0.08)] dark:bg-blue-500"
              >
                VS
              </motion.span>
            </div>

            <p className="flex min-h-[2.6rem] items-center justify-center px-1 text-center text-sm font-semibold leading-snug text-foreground line-clamp-2">
              {item.productB.name}
            </p>

            <div
              className="relative mx-auto mt-4 flex w-full shrink-0 items-center justify-center overflow-hidden rounded-xl"
              style={{ height: 112 }}
            >
              {item.productB.image && (
                <motion.img
                  src={item.productB.image}
                  alt={item.productB.name}
                  variants={reduceMotion ? undefined : productBVariants}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="rounded-xl"
                  style={{
                    maxHeight: "112px",
                    maxWidth: "70%",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                  }}
                />
              )}
            </div>

            <motion.div
              variants={reduceMotion ? undefined : ctaVariants}
              className="mt-5 flex items-center justify-center gap-1.5 border-t border-border pt-4"
            >
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Compare now
              </span>
              <motion.svg
                variants={reduceMotion ? undefined : arrowVariants}
                className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </motion.svg>
            </motion.div>
          </div>
        </motion.div>
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
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M8 7l4-4 4 4M8 17l4 4 4-4M12 3v18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
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