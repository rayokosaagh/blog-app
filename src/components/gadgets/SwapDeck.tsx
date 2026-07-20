"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Repeat } from "lucide-react";
import Underline from "../ui/Underline";

// One snappy, no-bounce slide reused for the title, the content panel and the
// toggle icon so the whole swap moves as a single consistent step — fits the
// hard-edged neo-brutalist system (quick, linear-ish, no spring).
const SWAP_T = { duration: 0.16, ease: "easeOut" as const };

interface SwapDeckProps {
  front: ReactNode;
  back: ReactNode;
  frontLabel?: string;
  backLabel?: string;
  frontTitle?: string;
  backTitle?: string;
  active: "front" | "back";
  onToggle: () => void;
}

export default function SwapDeck({
  front,
  back,
  frontLabel,
  backLabel,
  frontTitle,
  backTitle,
  active,
  onToggle,
}: SwapDeckProps) {
  const showFront = active === "front";
  const title = showFront ? frontTitle : backTitle;
  const activeContent = showFront ? front : back;

  return (
    <div className="relative w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <AnimatePresence mode="wait">
          <motion.h3
            key={title}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={SWAP_T}
            className="group inline-block text-base sm:text-lg font-extrabold uppercase tracking-wide text-foreground"
          >
            <Underline>{title}</Underline>
          </motion.h3>
        </AnimatePresence>

        <button
          type="button"
          onClick={onToggle}
          aria-label={`Switch to ${showFront ? backLabel ?? "other" : frontLabel ?? "other"} view`}
          className="flex items-center justify-center w-9 h-9 rounded-none bg-accent-2 text-on-accent-2 border-2 border-border-heavy shadow-brutal-sm brutal-press shrink-0"
        >
          <motion.span
            key={active}
            initial={{ rotate: 0 }}
            animate={{ rotate: 180 }}
            transition={SWAP_T}
            className="flex"
          >
            <Repeat className="w-4 h-4" />
          </motion.span>
        </button>
      </div>

      {/* Swapping content — no border/card here, parent supplies the single outer card.
          Translate-only, no opacity crossfade (see Poll.tsx carousel reference).
          No `layout` prop here on purpose — it was running its own reflow
          animation in parallel with the x-translate, and the two fighting
          for control of the same 90ms window is what read as clunky. Height
          now snaps instantly (a hard cut, which fits the system better
          anyway) while only the content itself slides. mode="wait" makes it
          a clean single step — old panel fully out, then new panel in —
          rather than both overlapping mid-flight. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={SWAP_T}
        >
          {activeContent}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}