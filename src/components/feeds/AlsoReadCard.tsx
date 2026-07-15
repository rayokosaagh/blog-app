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
 * Signature move: a thick block spine runs down the left edge connecting
 * numbered stops, drawing itself in on scroll — same "trail" pattern as
 * KeyHighlightsCard, kept consistent across both components.
 */
export default function AlsoReadCard({ links }: AlsoReadCardProps) {
  const shouldReduceMotion = useReducedMotion();
  if (links.length === 0) return null;

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.06,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  // Tween, not spring — springs are reserved for position-only moving
  // indicators, not routine content reveals.
  const itemVariants: Variants = {
    hidden: { opacity: 0, x: shouldReduceMotion ? 0 : -14 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.25, ease: "easeOut" },
    },
  };

  const lineVariants: Variants = {
    hidden: { scaleY: 0 },
    visible: {
      scaleY: 1,
      transition: { duration: shouldReduceMotion ? 0 : 0.3, ease: "easeOut", delay: 0.1 },
    },
  };

  return (
    <motion.div
      className="not-prose relative bg-card border-2 border-border-heavy rounded-none shadow-brutal"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={containerVariants}
    >
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-none bg-accent border-2 border-border-heavy shadow-brutal-sm">
            <CornerDownRight className="h-3 w-3 text-on-accent" />
          </span>
          <p className="text-xs font-extrabold uppercase tracking-wide text-accent">
            Also read
          </p>
        </div>

        <div className="relative">
          {/* Connecting spine — thick block bar, not a hairline. Heavy
              weight, since it's playing a structural role here rather
              than a quiet internal divider. Centered under the 20px
              number badges (badge center ≈ 10px, spine spans 8–12px). */}
          <motion.div
            aria-hidden
            variants={lineVariants}
            className="absolute left-2 top-1 bottom-1 w-1 origin-top bg-border-heavy"
          />

          <ul className="flex flex-col gap-0.5">
            {links.map((link, i) => (
              <motion.li key={link.href + i} variants={itemVariants} className="relative list-none">
                <a
                  href={link.href}
                  {...toReactProps(link.attrs)}
                  className={`group relative flex items-center gap-3.5 rounded-none py-2.5 pr-3 pl-0 no-underline outline-none hover:bg-accent-tint focus-visible:bg-accent-tint transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    (link.attrs?.class as string | undefined) || ""
                  }`}
                  style={{ textDecoration: "none" }}
                >
                  <span className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-none border-2 border-border-heavy bg-card text-[10px] font-extrabold text-accent transition-colors duration-100 group-hover:bg-accent group-hover:text-on-accent group-focus-visible:bg-accent group-focus-visible:text-on-accent">
                    {i + 1}
                  </span>

                  <span className="flex-1 text-[14px] leading-snug text-foreground transition-colors duration-100 group-hover:text-accent group-focus-visible:text-accent">
                    {link.text}
                  </span>

                  <span className="shrink-0 text-accent opacity-0 -translate-x-1 transition-all duration-150 ease-out group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </a>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}