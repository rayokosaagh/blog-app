"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Repeat } from "lucide-react";
import Underline from "../ui/Underline";

// One duration and one easing curve for every part of the swap — panel, title
// and toggle icon — so the whole thing reads as a single movement instead of
// three overlapping ones. The curve is a standard decelerate (fast out, gentle
// settle) with no overshoot.
const SWAP_DURATION = 0.28;
const SWAP_EASE = [0.22, 1, 0.36, 1] as const;

const SWAP_T = { duration: SWAP_DURATION, ease: SWAP_EASE };
// The title is a single line swapping in place, so it gets both halves of its
// cross-fade inside the panel's single duration rather than doubling it.
const TITLE_T = { duration: SWAP_DURATION / 2, ease: SWAP_EASE };

/** Height/size tween shared with the parent card so both resize as one. */
export const SWAP_LAYOUT_T = { duration: SWAP_DURATION, ease: SWAP_EASE };

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
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between mb-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.h3
            key={title}
            initial={{ opacity: 0, x: reduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduceMotion ? 0 : -10 }}
            transition={TITLE_T}
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
          {/* Driven by state, not by a remount. The old version keyed this on
              `active` with initial:0 -> animate:180, so every toggle tore the
              node down and replayed the same 0->180 spin — the icon snapped
              back to 0 between clicks instead of continuing. Rotating to a
              state-derived angle makes it turn one way out and back the
              other, which is what a swap control should look like. */}
          <motion.span
            animate={{ rotate: showFront ? 0 : 180 }}
            transition={reduceMotion ? { duration: 0 } : SWAP_T}
            className="flex"
          >
            <Repeat className="w-4 h-4" />
          </motion.span>
        </button>
      </div>

      {/* Swapping content.
          `layout` + popLayout is the pairing that matters here. The previous
          version used mode="wait" with no layout animation, so the panel had
          to fully leave before the next arrived and the card's height was
          left to snap on a single frame — measured at a 313px jump when the
          product grid unmounted.
          popLayout takes the outgoing panel out of document flow the instant
          it starts leaving, so the incoming panel defines the new height
          immediately and `layout` tweens the container to it over the same
          0.28s the cross-fade runs. One movement, no dead frame, no snap. */}
      <motion.div
        layout
        transition={{ layout: reduceMotion ? { duration: 0 } : SWAP_LAYOUT_T }}
        className="relative"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0, x: reduceMotion ? 0 : 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduceMotion ? 0 : -14 }}
            transition={reduceMotion ? { duration: 0 } : SWAP_T}
          >
            {activeContent}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
