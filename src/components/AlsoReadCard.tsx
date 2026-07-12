"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowUpRight, CornerDownRight } from "lucide-react";
import type { AlsoReadLink } from "./AlsoRead";

/**
 * link.attrs comes straight from the original <a> tag's raw HTML attributes
 * (via cheerio), so it can contain things React can't spread as-is: `class`
 * needs to become `className`, and `style` arrives as a CSS string rather
 * than the object form React expects. Anything else (target, rel, data-*)
 * passes through unchanged.
 */
function toReactProps(attrs?: Record<string, string>): Record<string, unknown> {
  if (!attrs) return {};
  const props: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") {
      // Merged into className manually where this is used, to avoid
      // clobbering our own layout/hover classes.
      continue;
    } else if (key === "style") {
      // Rare on these links; drop rather than risk a malformed parse.
      continue;
    } else {
      props[key] = value;
    }
  }

  return props;
}

interface AlsoReadCardProps {
  links: AlsoReadLink[];
}

/**
 * Animated "Also read" block. Rendered client-side by <AlsoReadMount />
 * into the placeholder that parseAlsoReadBlock() emits — never rendered
 * directly from a Server Component, since it needs motion + hover state.
 *
 * Signature move: a trail line runs down the left edge connecting numbered
 * stops, drawing itself in on scroll, echoing the "here's where to go next"
 * idea the block is actually for, instead of a generic numbered grid.
 */
export default function AlsoReadCard({ links }: AlsoReadCardProps) {
  const shouldReduceMotion = useReducedMotion();
  if (links.length === 0) return null;

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: shouldReduceMotion ? 0 : -14 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 320, damping: 28 },
    },
  };

  const lineVariants: Variants = {
    hidden: { scaleY: 0 },
    visible: {
      scaleY: 1,
      transition: { duration: shouldReduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const dotFillVariants: Variants = {
    rest: { scale: 0 },
    hover: { scale: 1, transition: { type: "spring", stiffness: 420, damping: 24 } },
  };

  const arrowVariants: Variants = {
    rest: { opacity: 0, x: -4 },
    hover: { opacity: 1, x: 0, transition: { duration: 0.18 } },
  };

  return (
    <motion.div
      className="not-prose relative overflow-hidden rounded-2xl border"
      style={{
        borderColor: "var(--border)",
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, var(--muted)) 0%, var(--muted) 55%)",
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={containerVariants}
    >
      <div className="relative px-5 py-5 sm:px-6 sm:py-6">
        <div className="mb-5 flex items-center gap-2">
          <span
            className="flex h-[22px] w-[22px] items-center justify-center rounded-full"
            style={{ background: "var(--accent)", color: "var(--background)" }}
          >
            <CornerDownRight className="h-3 w-3" />
          </span>
          <p className="text-sm font-semibold tracking-wide" style={{ color: "var(--foreground)" }}>
            Also read
          </p>
        </div>

        <div className="relative">
          {/* trail line connecting the stops */}
          <motion.div
            aria-hidden
            variants={lineVariants}
            className="absolute left-[9px] top-1 bottom-1 w-px origin-top"
            style={{ background: "var(--border)" }}
          />

          <ul className="flex flex-col gap-0.5">
            {links.map((link, i) => (
              <motion.li key={link.href + i} variants={itemVariants} className="relative list-none">
                <motion.a
                  href={link.href}
                  {...toReactProps(link.attrs)}
                  initial="rest"
                  whileHover="hover"
                  whileFocus="hover"
                  whileTap={{ scale: 0.985 }}
                  className={`group relative flex items-center gap-3.5 rounded-xl py-2.5 pr-3 pl-0 no-underline outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    (link.attrs?.class as string | undefined) || ""
                  }`}
                  style={{
                    ["--tw-ring-color" as any]: "var(--accent)",
                    textDecoration: "none",
                  }}
                >
                  <span
                    className="relative z-10 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-2 text-[9px] font-bold"
                    style={{ borderColor: "var(--accent)", background: "var(--card)" }}
                  >
                    <motion.span
                      aria-hidden
                      variants={dotFillVariants}
                      className="absolute inset-0 rounded-full"
                      style={{ background: "var(--accent)" }}
                    />
                    <span
                      className="relative z-10 transition-colors duration-200 group-hover:text-[color:var(--card)]"
                      style={{ color: "var(--accent)" }}
                    >
                      {i + 1}
                    </span>
                  </span>

                  <span
                    className="flex-1 text-[14px] leading-snug transition-colors duration-200 group-hover:text-[color:var(--accent)]"
                    style={{ color: "var(--foreground)" }}
                  >
                    {link.text}
                  </span>

                  <motion.span variants={arrowVariants} className="shrink-0">
                    <ArrowUpRight className="h-4 w-4" style={{ color: "var(--accent)" }} />
                  </motion.span>
                </motion.a>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}