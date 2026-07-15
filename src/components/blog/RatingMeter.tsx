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

// Segment colors are semantic feedback colors (bad → great), not brand
// tokens — they intentionally stay fixed across light/dark mode. The
// brutalist treatment here is to use them as solid blocks/borders rather
// than translucent glows, not to replace them with accent/accent-2.
type FaceKey = "bad" | "meh" | "okay" | "good" | "great";

function segmentFor(value: number) {
  if (value <= 2) return { face: "bad" as FaceKey, label: "Needs work", color: "#f43f5e" };
  if (value <= 4) return { face: "meh" as FaceKey, label: "Could be better", color: "#fb923c" };
  if (value <= 6) return { face: "okay" as FaceKey, label: "It's okay", color: "#eab308" };
  if (value <= 8) return { face: "good" as FaceKey, label: "Pretty good", color: "#4ade80" };
  return { face: "great" as FaceKey, label: "Loved it!", color: "#22d3ee" };
}

// Shown before anyone (including the current visitor) has rated the post.
const UNRATED_SEG = { face: "unrated" as const, label: "Not yet rated", color: "#94a3b8" };

// Hand-drawn geometric faces — square eyes, straight/angular mouths, sharp
// miter joins (no strokeLinecap="round" anywhere). This is the brutalist
// swap for the old rounded unicode emoji: same emotional read, none of the
// soft curvature.
function Face({ face, color }: { face: FaceKey; color: string }) {
  const line = "var(--foreground)";
  const common = { fill: "none", strokeWidth: 4, strokeLinecap: "square" as const, strokeLinejoin: "miter" as const };

  switch (face) {
    case "bad":
      return (
        <svg viewBox="0 0 48 48" width="40" height="40">
          <path d="M11 15 L19 23 M19 15 L11 23" stroke={line} {...common} />
          <path d="M29 15 L37 23 M37 15 L29 23" stroke={line} {...common} />
          <path d="M12 37 L24 30 L36 37" stroke={color} {...common} />
        </svg>
      );
    case "meh":
      return (
        <svg viewBox="0 0 48 48" width="40" height="40">
          <rect x="11" y="18" width="9" height="4" fill={line} />
          <rect x="28" y="18" width="9" height="4" fill={line} />
          <path d="M13 34 L35 30" stroke={color} {...common} />
        </svg>
      );
    case "okay":
      return (
        <svg viewBox="0 0 48 48" width="40" height="40">
          <rect x="12" y="16" width="8" height="8" fill={line} />
          <rect x="28" y="16" width="8" height="8" fill={line} />
          <path d="M13 33 L35 33" stroke={color} {...common} />
        </svg>
      );
    case "good":
      return (
        <svg viewBox="0 0 48 48" width="40" height="40">
          <rect x="12" y="15" width="8" height="8" fill={line} />
          <rect x="28" y="15" width="8" height="8" fill={line} />
          <path d="M11 29 L24 38 L37 29" stroke={color} {...common} />
        </svg>
      );
    case "great":
      return (
        <svg viewBox="0 0 48 48" width="40" height="40">
          <path d="M16 10 L18.5 15.5 L24 16 L19.5 19.5 L21 25 L16 21.5 L11 25 L12.5 19.5 L8 16 L13.5 15.5 Z" fill={color} />
          <path d="M32 10 L34.5 15.5 L40 16 L35.5 19.5 L37 25 L32 21.5 L27 25 L28.5 19.5 L24 16 L29.5 15.5 Z" fill={color} />
          <path d="M11 29 L37 29 L33 40 L15 40 Z" fill={color} stroke={line} strokeWidth={3} strokeLinejoin="miter" />
        </svg>
      );
  }
}

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
      className={`bg-card border-2 border-border-heavy rounded-none shadow-brutal px-6 py-8 md:px-8 ${className}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Star size={22} className="text-accent" />
          <h2 className="text-2xl font-extrabold text-foreground">Rate this article</h2>
        </div>

        <AnimatePresence mode="wait">
          {average !== null && average > 0 && (
            <motion.div
              key="avg-pill"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex shrink-0 items-center gap-2 rounded-none border-2 border-border-heavy shadow-brutal-sm pl-2.5 pr-3 py-1.5"
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-none border-2 border-border-heavy text-[11px] font-extrabold text-white"
                style={{ backgroundColor: seg.color }}
              >
                ★
              </span>
              <span className="text-sm font-bold tabular-nums text-foreground">
                <AnimatedNumber value={average} />
              </span>
              <span className="text-xs text-muted-foreground">
                · {count} rating{count === 1 ? "" : "s"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t-2 border-border-heavy mt-4 mb-4" />

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
            className="h-16 w-16 border-2 border-border-heavy bg-border mx-auto"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          <motion.div
            className="h-3 w-full max-w-md border-2 border-border-heavy bg-border mx-auto"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: 0.1 }}
          />
        </div>
      ) : (
        <div className="relative flex flex-col items-center gap-4 select-none">
          {/* Emoji — bordered square badge instead of a translucent glow
              backdrop; the segment color reads through a hard 3px border
              rather than a soft alpha wash. */}
          <div className="relative h-16 flex items-center justify-center">
            <motion.div
              className="absolute h-14 w-14 bg-card"
              style={{ borderWidth: 3, borderStyle: "solid", borderColor: seg.color }}
              animate={{
                scale: dragging ? 1.15 : 1,
                // hard mechanical shake on submit — three quick snaps, no
                // ease-in/out curve, reads like a stamp hitting the page
                rotate: justSubmitted ? [0, -8, 8, -4, 0] : 0,
              }}
              transition={
                justSubmitted
                  ? { rotate: { duration: 0.35, ease: "linear" }, scale: { duration: 0.25 } }
                  : { duration: 0.25 }
              }
            />
            <AnimatePresence mode="popLayout">
              <motion.div
                key={seg.face}
                initial={{ scale: 1.5, rotate: -8, opacity: 0 }}
                animate={{ scale: dragging ? 1.2 : 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.5, rotate: 8, opacity: 0 }}
                transition={{ duration: 0.13, ease: [0.4, 0, 0.2, 1] }}
                className="relative flex items-center justify-center leading-none"
              >
                {seg.face === "unrated" ? (
                  <span className="font-black text-4xl leading-none text-muted-foreground select-none">
                    ?
                  </span>
                ) : (
                  <Face face={seg.face} color={seg.color} />
                )}
              </motion.div>
            </AnimatePresence>

            {/* one-off success pulse ring — already hard-edged (solid 2px
                ring, no blur), kept as-is */}
            <AnimatePresence>
              {justSubmitted && (
                <motion.div
                  className="absolute h-14 w-14"
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
              className="flex items-center gap-2 text-sm font-extrabold"
              style={{ color: seg.color }}
            >
              {seg.label}
              {!isUnrated && (
                <span className="rounded-none border-2 border-border-heavy bg-border px-2 py-0.5 text-xs font-extrabold text-muted-foreground tabular-nums">
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
        className="absolute -top-9 -translate-x-1/2 rounded-none border-2 border-border-heavy px-2 py-1 text-xs font-extrabold text-white"
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

  {/* Pointer-interaction wrapper — NOT clipped, so the thumb (which is
      taller than the track) and the average marker can render at full
      size instead of being cut off by the track's clipping. */}
  <motion.div
    ref={trackRef}
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerUp}
    className="group relative h-3 w-full cursor-pointer touch-none"
    animate={{
      opacity: isUnrated ? 0.6 : 1,
    }}
    transition={{ duration: 0.25 }}
  >
    {/* Clipped layer — only the track background, fill, and tick marks
        live here. Square edges, solid 2px border — no pill shape. */}
    <div className="absolute inset-0 border-2 border-border-heavy bg-border overflow-hidden">
      {/* flat solid fill, tracks the current segment color */}
      <motion.div
        className="absolute inset-y-0 left-0"
        animate={{ width: `${pct}%`, backgroundColor: seg.color }}
        transition={dragging ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 30 }}
      />

      {/* tick marks — solid, not translucent */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-1">
        {Array.from({ length: MAX - MIN + 1 }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 w-0.5 bg-border-heavy"
          />
        ))}
      </div>
    </div>

    {/* community average marker — rendered outside the clipped layer so
        its full height is visible instead of being cropped to the
        track's height. Solid fill with a background-colored stroke for
        contrast against whatever segment color sits behind it. */}
    {average !== null && average > 0 && (
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, left: `${((average - MIN) / (MAX - MIN)) * 100}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        title={`Average: ${average.toFixed(1)}`}
      >
        <div className="h-6 w-1 bg-foreground border border-background" />
      </motion.div>
    )}

    {/* thumb — square brutalist handle instead of a circle, rendered
        outside the clipped layer so it isn't sliced by the track. */}
    <motion.div
      className="absolute top-1/2 flex h-7 w-7 items-center justify-center bg-card shadow-brutal-sm"
      style={{ borderWidth: 3, borderStyle: "solid", borderColor: seg.color }}
      animate={{
        left: `${pct}%`,
        scale: dragging ? 1.3 : 1,
        y: "-50%",
        x: "-50%",
      }}
      transition={thumbTransition}
    >
      <motion.div
        className="h-2.5 w-2.5"
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
                  onClick={() => setSubmitted(false)}
                  className="flex items-center gap-1 rounded-none border-2 border-border-heavy shadow-brutal-sm brutal-press px-3 py-1 text-xs font-bold text-muted-foreground hover:text-accent transition-colors"
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