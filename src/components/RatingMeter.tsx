"use client";

// src/components/RatingMeter.tsx
//
// Usage (e.g. inside src/app/blog/[slug]/page.tsx, at the bottom of the article):
//   <RatingMeter postId={post.id} />

import { useEffect, useRef, useState, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

interface RatingMeterProps {
  postId: string;
  className?: string;
}

const MIN = 1;
const MAX = 10;

function segmentFor(value: number) {
  if (value <= 2) return { emoji: "😖", label: "Needs work", color: "#f43f5e" };
  if (value <= 4) return { emoji: "🙁", label: "Could be better", color: "#fb923c" };
  if (value <= 6) return { emoji: "😐", label: "It's okay", color: "#eab308" };
  if (value <= 8) return { emoji: "🙂", label: "Pretty good", color: "#4ade80" };
  return { emoji: "🤩", label: "Loved it!", color: "#22d3ee" };
}

// Shown before anyone (including the current visitor) has rated the post.
const UNRATED_SEG = { emoji: "🤔", label: "Not yet rated", color: "#94a3b8" };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

// Smoothly counts up/down to `value`, rendered with 1 decimal place.
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 120, damping: 20 });
  const display = useTransform(spring, (v) => v.toFixed(1));
  const [text, setText] = useState(value.toFixed(1));

  useEffect(() => {
    mv.set(value);
  }, [value, mv]);

  useEffect(() => {
    const unsub = display.on("change", (v) => setText(v));
    return () => unsub();
  }, [display]);

  return <span className={className}>{text}</span>;
}

export default function RatingMeter({ postId, className = "" }: RatingMeterProps) {
  const [value, setValue] = useState(7); // live/dragging or user's saved value
  const [dragging, setDragging] = useState(false);
  const [interacted, setInteracted] = useState(false); // has the visitor touched the slider this session
  const [submitted, setSubmitted] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false); // triggers the one-off pulse
  const [average, setAverage] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);

  // Load existing average / user's prior rating on mount
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/posts/${postId}/rating`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setAverage(data.average || null);
        setCount(data.count || 0);
        if (data.userValue) {
          setValue(data.userValue);
          setSubmitted(true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const submit = useCallback(
    async (v: number) => {
      try {
        const res = await fetch(`/api/posts/${postId}/rating`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: v }),
        });
        const data = await res.json();
        if (res.ok) {
          setAverage(data.average);
          setCount(data.count);
          setSubmitted(true);
          setJustSubmitted(true);
          setTimeout(() => setJustSubmitted(false), 700);
        }
      } catch {
        // silently ignore — rating is a nice-to-have, not critical path
      }
    },
    [postId]
  );

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return value;
      const rect = el.getBoundingClientRect();
      const pct = clamp((clientX - rect.left) / rect.width, 0, 1);
      return Math.round(MIN + pct * (MAX - MIN));
    },
    [value]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    setDragging(true);
    setInteracted(true);
    setValue(valueFromClientX(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setValue(valueFromClientX(e.clientX));
  };

  const handlePointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    submit(value);
  };

  // Nobody — including this visitor — has rated the post yet, and they haven't
  // touched the slider this session: sit at the start with a neutral prompt
  // instead of implying a rating (e.g. defaulting to "Pretty good").
  const isUnrated = !submitted && !interacted && count === 0;

  const seg = isUnrated ? UNRATED_SEG : segmentFor(value);
  const pct = isUnrated ? 0 : ((value - MIN) / (MAX - MIN)) * 100;

  if (loading) {
    return (
      <motion.div
        className={`h-28 rounded-3xl bg-neutral-100 dark:bg-neutral-800/60 ${className}`}
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  }

  // Snap smoothly on release; track the finger 1:1 while dragging.
  const thumbTransition = dragging
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 28 };

  return (
    <motion.div
      className={`relative w-full overflow-hidden rounded-3xl border border-neutral-200/70 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset,0_20px_50px_-20px_rgba(0,0,0,0.25)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_20px_50px_-20px_rgba(0,0,0,0.6)] ${className}`}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* ambient glow that follows the current segment color */}
      <motion.div
        className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[120%] -translate-x-1/2 rounded-full blur-3xl opacity-20 dark:opacity-25"
        animate={{ backgroundColor: seg.color }}
        transition={{ duration: 0.4 }}
      />

      <div className="relative flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">
            How did we do with this article?
          </h3>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
            {submitted
              ? "You rated this"
              : isUnrated
              ? "Not yet rated — be the first"
              : "Drag to rate, release to submit"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {average !== null && average > 0 && (
            <motion.div
              key="avg-pill"
              initial={{ opacity: 0, scale: 0.85, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex shrink-0 items-center gap-2 rounded-full border border-neutral-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 pl-2.5 pr-3 py-1.5 shadow-sm"
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: seg.color }}
              >
                ★
              </span>
              <span className="text-sm font-semibold tabular-nums">
                <AnimatedNumber value={average} />
              </span>
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                · {count} rating{count === 1 ? "" : "s"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative flex flex-col items-center gap-4 select-none">
        {/* Emoji — pops and flips when it crosses into a new segment */}
        <div className="relative h-16 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full blur-xl opacity-30"
            animate={{ backgroundColor: seg.color, scale: dragging ? 1.4 : 1.1 }}
            transition={{ duration: 0.3 }}
          />
          <AnimatePresence mode="popLayout">
            <motion.div
              key={seg.emoji}
              initial={{ scale: 0.3, rotate: -90, opacity: 0 }}
              animate={{
                scale: dragging ? 1.3 : 1,
                rotate: 0,
                opacity: 1,
              }}
              exit={{ scale: 0.3, rotate: 90, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="relative text-6xl leading-none drop-shadow-sm"
            >
              {seg.emoji}
            </motion.div>
          </AnimatePresence>

          {/* one-off success pulse ring */}
          <AnimatePresence>
            {justSubmitted && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ boxShadow: `0 0 0 2px ${seg.color}` }}
                initial={{ scale: 0.6, opacity: 0.8 }}
                animate={{ scale: 2.4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={seg.label}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 text-sm font-semibold"
            style={{ color: seg.color }}
          >
            {seg.label}
            {!isUnrated && (
              <span className="rounded-full bg-neutral-100 dark:bg-white/10 px-2 py-0.5 text-xs font-bold text-neutral-500 dark:text-neutral-300 tabular-nums">
                {value}/10
              </span>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Track */}
        <div className="relative w-full max-w-md mt-1">
          {/* floating value bubble while dragging */}
          <AnimatePresence>
            {dragging && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1, left: `${pct}%` }}
                exit={{ opacity: 0, y: 6, scale: 0.8 }}
                transition={{ left: { duration: 0 }, default: { duration: 0.15 } }}
                className="absolute -top-9 -translate-x-1/2 rounded-lg px-2 py-1 text-xs font-bold text-white shadow-lg"
                style={{ backgroundColor: seg.color }}
              >
                {value}
                <div
                  className="absolute left-1/2 top-full -translate-x-1/2 h-0 w-0"
                  style={{
                    borderLeft: "4px solid transparent",
                    borderRight: "4px solid transparent",
                    borderTop: `4px solid ${seg.color}`,
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            ref={trackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="group relative h-3.5 w-full rounded-full cursor-pointer touch-none ring-1 ring-black/5 dark:ring-white/10"
            animate={{
              boxShadow: dragging
                ? `0 0 0 8px ${seg.color}1f, 0 0 24px ${seg.color}66`
                : `0 0 0 0px ${seg.color}00, 0 0 0px ${seg.color}00`,
              filter: isUnrated ? "grayscale(0.85) opacity(0.6)" : "grayscale(0) opacity(1)",
            }}
            whileHover={{ scale: dragging ? 1 : 1.01 }}
            transition={{ duration: 0.25 }}
            style={{
              background:
                "linear-gradient(90deg, #f43f5e 0%, #fb923c 25%, #eab308 50%, #4ade80 75%, #22d3ee 100%)",
            }}
          >
            {/* subtle inner highlight for glassy depth */}
            <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/40 to-transparent dark:from-white/10" />

            {/* tick marks */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-1">
              {Array.from({ length: MAX - MIN + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="h-1 w-0.5 rounded-full bg-white/50 dark:bg-black/20"
                />
              ))}
            </div>

            {/* community average marker */}
            {average !== null && average > 0 && (
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, left: `${((average - MIN) / (MAX - MIN)) * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                title={`Average: ${average.toFixed(1)}`}
              >
                <div className="h-6 w-[3px] rounded-full bg-neutral-900/70 dark:bg-white/70 shadow-sm" />
              </motion.div>
            )}

            {/* thumb */}
            <motion.div
              className="absolute top-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.25)] border-[3px]"
              style={{ borderColor: seg.color }}
              animate={{
                left: `${pct}%`,
                scale: dragging ? 1.35 : 1,
                y: "-50%",
                x: "-50%",
              }}
              transition={thumbTransition}
            >
              <motion.div
                className="h-2 w-2 rounded-full"
                animate={{ backgroundColor: seg.color }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </motion.div>
        </div>

        <div className="h-5">
          <AnimatePresence mode="wait">
            {submitted && (
              <motion.button
                key="rate-again"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSubmitted(false)}
                className="flex items-center gap-1 rounded-full border border-neutral-200 dark:border-white/10 px-3 py-1 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:border-neutral-300 dark:hover:border-white/20 transition-colors"
              >
                ↺ Rate again
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}