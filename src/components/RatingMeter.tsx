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
import { Star } from "lucide-react";

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

  // Snap smoothly on release; track the finger 1:1 while dragging.
  const thumbTransition = dragging
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 28 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`bg-card border border-border rounded-2xl shadow-xl px-6 py-8 md:px-8 ${className}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Star size={22} className="text-blue-600" />
          <h2 className="text-2xl font-bold text-foreground">Rate this article</h2>
        </div>

        <AnimatePresence mode="wait">
          {average !== null && average > 0 && (
            <motion.div
              key="avg-pill"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-border pl-2.5 pr-3 py-1.5"
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold text-white"
                style={{ backgroundColor: seg.color }}
              >
                ★
              </span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                <AnimatedNumber value={average} />
              </span>
              <span className="text-xs text-muted-foreground">
                · {count} rating{count === 1 ? "" : "s"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-b border-border mt-4 mb-4" />

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        {submitted
          ? "You rated this — thanks for the feedback!"
          : isUnrated
          ? "Not yet rated — be the first to let us know what you think."
          : "Drag the slider to rate, release to submit."}
      </p>

      {loading ? (
        <div className="space-y-4">
          <motion.div
            className="h-16 w-16 rounded-full bg-muted mx-auto"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          <motion.div
            className="h-3 w-full max-w-md rounded bg-muted mx-auto"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: 0.1 }}
          />
        </div>
      ) : (
        <div className="relative flex flex-col items-center gap-4 select-none">
          {/* Emoji — flat circle backdrop, pops when it crosses into a new segment */}
          <div className="relative h-16 flex items-center justify-center">
            <motion.div
              className="absolute h-14 w-14 rounded-full"
              animate={{ backgroundColor: `${seg.color}1a`, scale: dragging ? 1.15 : 1 }}
              transition={{ duration: 0.25 }}
            />
            <AnimatePresence mode="popLayout">
              <motion.div
                key={seg.emoji}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: dragging ? 1.25 : 1, opacity: 1 }}
                exit={{ scale: 0.3, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="relative text-5xl leading-none"
              >
                {seg.emoji}
              </motion.div>
            </AnimatePresence>

            {/* one-off success pulse ring */}
            <AnimatePresence>
              {justSubmitted && (
                <motion.div
                  className="absolute h-14 w-14 rounded-full"
                  style={{ boxShadow: `0 0 0 2px ${seg.color}` }}
                  initial={{ scale: 0.7, opacity: 0.8 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={seg.label}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: seg.color }}
            >
              {seg.label}
              {!isUnrated && (
                <span className="rounded-md bg-border px-2 py-0.5 text-xs font-bold text-muted-foreground tabular-nums">
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
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, left: `${pct}%` }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ left: { duration: 0 }, default: { duration: 0.15 } }}
                  className="absolute -top-9 -translate-x-1/2 rounded-md px-2 py-1 text-xs font-bold text-white"
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
              className="group relative h-3 w-full rounded-full cursor-pointer touch-none bg-muted overflow-hidden"
              animate={{
                opacity: isUnrated ? 0.6 : 1,
              }}
              transition={{ duration: 0.25 }}
            >
              {/* flat solid fill, replaces the decorative rainbow gradient */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                animate={{ width: `${pct}%`, backgroundColor: seg.color }}
                transition={dragging ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 30 }}
              />

              {/* tick marks */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-1">
                {Array.from({ length: MAX - MIN + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1 w-0.5 rounded-full bg-background/60"
                  />
                ))}
              </div>

              {/* community average marker */}
              {average !== null && average > 0 && (
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, left: `${((average - MIN) / (MAX - MIN)) * 100}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  title={`Average: ${average.toFixed(1)}`}
                >
                  <div className="h-5 w-[3px] rounded-full bg-foreground/70" />
                </motion.div>
              )}

              {/* thumb */}
              <motion.div
                className="absolute top-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-card border-2"
                style={{ borderColor: seg.color }}
                animate={{
                  left: `${pct}%`,
                  scale: dragging ? 1.3 : 1,
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
                  className="flex items-center gap-1 rounded-md border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-blue-600 hover:border-blue-600 transition-colors"
                >
                  ↺ Rate again
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
}