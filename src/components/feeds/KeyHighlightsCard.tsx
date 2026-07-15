"use client";

import { motion, type Variants } from "motion/react";

interface KeyHighlightsCardProps {
  items: string[];
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

// Tween, not spring — springs read bouncy/organic, which the system
// reserves for position-only moving indicators (tab underlines, active
// dots), not routine content reveals.
const itemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

const pipVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

export default function KeyHighlightsCard({ items }: KeyHighlightsCardProps) {
  return (
    <motion.div
      className="not-prose bg-card border-2 border-border-heavy rounded-none shadow-brutal px-6 py-5"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <p className="text-xs font-extrabold uppercase tracking-wide text-accent mb-5">
        Key highlights
      </p>

      <motion.div
        className="relative pl-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* Connecting spine — thick block bar, not a hairline. Heavy
            weight, since it's playing a structural role here rather
            than a quiet internal divider. Centered under the pip
            column (pips are 14px wide starting at x=0, spine is 4px
            centered at x=7). */}
        <motion.span
          className="absolute left-[5px] top-1 w-1 bg-border-heavy origin-top"
          style={{ bottom: "0.375rem" }}
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
        />

        <div className="flex flex-col gap-6">
          {items.map((item, i) => (
            <motion.div key={i} className="relative group cursor-default" variants={itemVariants}>
              {/* Square pip — solid accent-2 block with its own heavy
                  border + hard shadow, so it reads as a stamped tile
                  sitting on the spine rather than a dot resting on it. */}
              <motion.span
                className="absolute -left-8 top-1 w-3.5 h-3.5 rounded-none bg-accent-2 border-2 border-border-heavy shadow-brutal-sm"
                variants={pipVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.2, ease: "easeOut" }}
              />
              <motion.span
                className="block text-[15px] leading-[1.65] text-foreground rounded-none -mx-2 px-2 py-0.5 hover:bg-accent-tint transition-colors duration-100"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {item}
              </motion.span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}