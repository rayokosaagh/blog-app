"use client";

import { motion, type Variants } from "motion/react";
import { getSpecIcon, getSpecAccent } from "./specIcons";

interface SpecItem {
  label: string;
  value: string;
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 320, damping: 28 },
  },
};

export default function SpecificationsCard({
  items,
  title = "Specifications",
}: {
  items: SpecItem[];
  title?: string;
}) {
  return (
    <div className="not-prose">
      <h1>{title}</h1>

      <motion.div
        className="flex flex-col gap-2"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {items.map((item, i) => {
          const Icon = getSpecIcon(item.label);
          const accent = getSpecAccent(item.label);
          return (
            <motion.div
              key={i}
              className="flex items-stretch rounded-lg overflow-hidden bg-muted/50"
              variants={itemVariants}
            >
              <div className={`w-1 shrink-0 ${accent.bar}`} />
              <div className="flex items-center gap-3 px-4 py-3.5 flex-1 min-w-0">
                <Icon className={`w-5 h-5 shrink-0 ${accent.icon}`} strokeWidth={2} />
                <span className="text-sm text-muted-foreground w-28 shrink-0">
                  {item.label}
                </span>
                <span className="text-base font-normal text-foreground break-words">
                  {item.value}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}