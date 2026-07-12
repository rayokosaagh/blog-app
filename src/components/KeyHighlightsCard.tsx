"use client";

import { motion, type Variants } from "motion/react";

interface KeyHighlightsCardProps {
  items: string[];
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 26 },
  },
};

const dotVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 500, damping: 20 },
  },
};

export default function KeyHighlightsCard({ items }: KeyHighlightsCardProps) {
  return (
    <motion.div
      className="not-prose bg-card border border-border rounded-2xl px-6 py-5"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <motion.p
        className="text-[15px] font-semibold text-foreground mb-5"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.3 }}
      >
        Key highlights
      </motion.p>

      <motion.div
        className="relative pl-7"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* Connecting line — draws downward as items reveal */}
        <motion.span
          className="absolute left-[5px] top-1.5 w-[2px] bg-border origin-top"
          style={{ bottom: "0.375rem" }}
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeInOut", delay: 0.1 }}
        />

        <div className="flex flex-col gap-[22px]">
          {items.map((item, i) => (
            <motion.div
              key={i}
              className="relative group cursor-default"
              variants={itemVariants}
              whileHover="hover"
            >
              <motion.span
                className="absolute -left-7 top-1.5 w-3 h-3 rounded-full bg-accent"
                variants={dotVariants}
                animate={undefined}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.15 + i * 0.12 }}
                whileHover={{ scale: 1.4 }}
              />
              <motion.span
                className="block text-[15px] leading-[1.65] text-foreground rounded-md -mx-2 px-2 py-0.5"
                variants={{
                  hover: {
                    x: 4,
                    backgroundColor: "color-mix(in srgb, var(--accent) 8%, transparent)",
                    transition: { duration: 0.2 },
                  },
                }}
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