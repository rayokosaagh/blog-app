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
//
// They drive the header band, the icon chip and the bullets. All the card
// chrome (border width, border color, radius, shadow) comes from the theme
// tokens via the `surface-*` utilities, so the block picks up hairline borders,
// 16px corners and soft shadows in modern exactly like every other card on the
// page, instead of being a green/red box that ignores the theme switch.
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
      // overflow-hidden matters in the modern theme: the card takes its radius
      // from `surface-border`, but the header band below is a square-cornered
      // child with its own background and would poke through the rounded top
      // edge. Same reason VerdictCard carries it.
      className="surface-border bg-card shadow-brutal overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Header band. The tint is mixed from the one semantic color against
          `transparent`, so it composites over --card and works unchanged on
          the white and near-black surfaces. */}
      <div
        className="flex items-center gap-2.5 px-5 py-3.5"
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 9%, transparent)`,
          borderBottomWidth: "var(--border-width)",
          borderBottomStyle: "solid",
          borderBottomColor: `color-mix(in srgb, ${color} 24%, transparent)`,
        }}
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center text-white"
          style={{ backgroundColor: color, borderRadius: "var(--radius-pill, 0)" }}
          aria-hidden
        >
          <Icon className="h-4 w-4" strokeWidth={2.75} />
        </span>
        <span
          className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
          style={{ color }}
        >
          {title}
        </span>
      </div>

      <motion.ul
        // Inline, not utilities: this card is mounted *inside*
        // `.rich-text-render`, whose `ul { padding-left: 1.75rem; margin:
        // 1.35rem 0 }` and `li { margin: 0.45rem 0 }` rules out-specify
        // Tailwind's utility layer. Left as classes the list picked up 43px of
        // article margin the SSR fallback doesn't have, so the block jumped on
        // hydration. These values are the ones fallbackPanel() writes in
        // ProsCons.tsx — keep them in sync.
        style={{ listStyle: "none", padding: "16px 20px 4px", margin: 0 }}
        variants={listVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {items.map((item, i) => (
          <motion.li
            key={i}
            variants={itemVariants}
            className="flex items-start gap-3"
            style={{ margin: "0 0 12px" }}
          >
            <span
              className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center"
              style={{
                backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
                color,
                borderRadius: "var(--radius-pill, 0)",
              }}
              aria-hidden
            >
              <Bullet className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className="text-[15px] leading-[1.65] text-foreground">{item}</span>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
}

export default function ProsConsCard({ pros, cons }: ProsConsData) {
  const both = pros.length > 0 && cons.length > 0;

  // Two side-by-side cards rather than one card with an internal divider —
  // no outer chrome and no heading, so the block reads as part of the article
  // instead of a widget dropped into it.
  return (
    <div className={`not-prose grid gap-4 ${both ? "sm:grid-cols-2" : ""}`}>
      <Panel title="Pros" items={pros} color={PROS_COLOR} Icon={ThumbsUp} Bullet={Check} />
      <Panel title="Cons" items={cons} color={CONS_COLOR} Icon={ThumbsDown} Bullet={X} />
    </div>
  );
}
