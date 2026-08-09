"use client";

import { motion, type Variants } from "motion/react";
import { Check, X, ThumbsUp, ThumbsDown } from "lucide-react";

export interface ProsConsData {
  pros: string[];
  cons: string[];
}

// Semantic feedback colors, not brand tokens — same reasoning as RatingMeter's
// segment colors: "good" and "bad" shouldn't re-map when the admin changes the
// site accent, so these stay fixed across both themes.
const PROS_COLOR = "#22c55e";
const CONS_COLOR = "#f43f5e";

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};

// Tween, not spring — springs are reserved for position-only moving indicators
// in this system, not routine content reveals.
const itemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

function Panel({
  title,
  items,
  color,
  Icon,
  Bullet,
}: {
  title: string;
  items: string[];
  color: string;
  Icon: typeof ThumbsUp;
  Bullet: typeof Check;
}) {
  if (items.length === 0) return null;

  return (
    <motion.div
      className="surface-border-w p-5"
      // Tint and border are mixed from the one semantic color so the panel
      // reads as "that colour's territory" without a heavy fill. color-mix
      // against `transparent` composites over --card, so it works unchanged on
      // the white and near-black surfaces.
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 7%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
      }}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center text-white"
          style={{ backgroundColor: color, borderRadius: "var(--radius-pill, 0)" }}
        >
          <Icon className="h-4 w-4" strokeWidth={2.75} />
        </span>
        <span className="text-sm font-extrabold uppercase tracking-wide" style={{ color }}>
          {title}
        </span>
      </div>

      <motion.ul
        className="space-y-2.5"
        variants={listVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {items.map((item, i) => (
          <motion.li key={i} variants={itemVariants} className="flex items-start gap-2.5">
            <Bullet
              className="mt-[3px] h-4 w-4 shrink-0"
              strokeWidth={3}
              style={{ color }}
              aria-hidden
            />
            <span className="text-sm leading-relaxed text-foreground">{item}</span>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
}

export default function ProsConsCard({ pros, cons }: ProsConsData) {
  const both = pros.length > 0 && cons.length > 0;

  // Two standalone tinted panels rather than one bordered card wrapping a
  // divided row — no outer chrome and no heading, so the block reads as part of
  // the article instead of a widget dropped into it.
  return (
    <div className={`not-prose grid gap-4 ${both ? "sm:grid-cols-2" : ""}`}>
      <Panel title="Pros" items={pros} color={PROS_COLOR} Icon={ThumbsUp} Bullet={Check} />
      <Panel title="Cons" items={cons} color={CONS_COLOR} Icon={ThumbsDown} Bullet={X} />
    </div>
  );
}
