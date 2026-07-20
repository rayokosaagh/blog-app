"use client";

import { useReducedMotion } from "framer-motion";

// Crisp bordered SVG shapes (triangle + plus/cross) — clip-path can't hold a
// heavy border, so SVG stroke gives the brutalist edge. Colors use theme vars
// so they flip in dark mode.
function TriangleShape({ size, fill }: { size: number; fill: string }) {
  return (
    <svg width={size} height={size * 0.9} viewBox="0 0 100 90" fill="none" aria-hidden>
      <polygon
        points="50,7 95,84 5,84"
        fill={fill}
        stroke="var(--border-heavy)"
        strokeWidth={9}
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function CrossShape({ size, fill }: { size: number; fill: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
      <path
        d="M38 6 H62 V38 H94 V62 H62 V94 H38 V62 H6 V38 H38 Z"
        fill={fill}
        stroke="var(--border-heavy)"
        strokeWidth={8}
        strokeLinejoin="miter"
      />
    </svg>
  );
}

// Hard-edged geometric shapes that fly all the way across the backdrop.
// Each travels from just off one edge to just off the opposite edge (vw/vh) via
// the shared `shape-travel` keyframe (defined in globals.css). A negative
// animation-delay drops each one in already mid-flight, so on load the screen is
// already full of moving shapes instead of empty for the first few seconds.
// Because both ends sit off-screen, the loop reset is invisible.
type Shape = {
  className?: string; // for plain div shapes (squares/circles/bars)
  node?: React.ReactNode; // for SVG shapes (triangle/cross)
  top: string | number;
  x: [string, string];
  y?: [string, string];
  r?: [string, string];
  duration: number;
  delay: number; // applied as a NEGATIVE delay → starts mid-flight
};

const R_FULL: [string, string] = ["0deg", "360deg"];

const SHAPES: Shape[] = [
  // big square
  {
    className: "h-40 w-40 bg-accent-2 border-4 border-border-heavy shadow-brutal",
    top: "8%",
    x: ["-30vw", "130vw"],
    r: R_FULL,
    duration: 22,
    delay: 5,
  },
  // circle, right → left
  {
    className: "h-16 w-16 rounded-full bg-accent border-4 border-border-heavy",
    top: "28%",
    x: ["130vw", "-25vw"],
    r: ["0deg", "-360deg"],
    duration: 17,
    delay: 11,
  },
  // big triangle flying diagonally down
  {
    node: <TriangleShape size={150} fill="var(--accent-3)" />,
    top: 0,
    x: ["-20vw", "120vw"],
    y: ["-5vh", "85vh"],
    r: R_FULL,
    duration: 26,
    delay: 9,
  },
  // long bar
  {
    className: "h-12 w-36 bg-foreground border-4 border-border-heavy",
    top: "70%",
    x: ["-30vw", "130vw"],
    r: ["-5deg", "5deg"],
    duration: 24,
    delay: 15,
  },
  // cross / plus, right → left
  {
    node: <CrossShape size={84} fill="var(--accent)" />,
    top: "46%",
    x: ["125vw", "-25vw"],
    r: ["0deg", "320deg"],
    duration: 21,
    delay: 3,
  },
  // small circle low down
  {
    className: "h-10 w-10 rounded-full bg-accent-2 border-4 border-border-heavy",
    top: "86%",
    x: ["-15vw", "115vw"],
    r: R_FULL,
    duration: 14,
    delay: 7,
  },
  // spinning diamond, diagonally upward
  {
    className: "h-16 w-16 bg-accent border-4 border-border-heavy shadow-brutal-sm",
    top: 0,
    x: ["120vw", "-20vw"],
    y: ["82vh", "4vh"],
    r: ["45deg", "405deg"],
    duration: 23,
    delay: 13,
  },
  // big outline block
  {
    className: "h-32 w-32 bg-transparent border-4 border-border-heavy",
    top: "40%",
    x: ["130vw", "-30vw"],
    r: ["0deg", "180deg"],
    duration: 28,
    delay: 1,
  },
  // small cross high up
  {
    node: <CrossShape size={56} fill="var(--accent-2)" />,
    top: "4%",
    x: ["-15vw", "115vw"],
    r: R_FULL,
    duration: 18,
    delay: 17,
  },
  // medium triangle, low, left → right
  {
    node: <TriangleShape size={90} fill="var(--accent)" />,
    top: "58%",
    x: ["-18vw", "118vw"],
    r: ["0deg", "-360deg"],
    duration: 20,
    delay: 19,
  },
];

/**
 * Neo-brutalist animated backdrop — a faint grid plus hard-edged shapes flying
 * across the viewport. Positioning is controlled by the caller via `className`
 * (e.g. `absolute inset-0 z-0` for a contained page, `fixed inset-0 -z-10` for
 * a whole-page backdrop). Respects the user's reduced-motion preference.
 */
export default function AnimatedBackground({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <div aria-hidden className={`pointer-events-none overflow-hidden ${className}`}>
      {/* faint grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.5,
        }}
      />

      {reduced ? (
        <>
          <div className="absolute -left-16 -top-16 h-56 w-56 bg-accent-2 border-4 border-border-heavy rotate-12" />
          <div className="absolute -right-20 bottom-10 h-40 w-40 bg-accent border-4 border-border-heavy -rotate-6" />
        </>
      ) : (
        SHAPES.map((s, i) => {
          const style = {
            top: s.top,
            left: 0,
            "--sx0": s.x[0],
            "--sx1": s.x[1],
            "--sy0": s.y?.[0] ?? "0px",
            "--sy1": s.y?.[1] ?? "0px",
            "--sr0": s.r?.[0] ?? "0deg",
            "--sr1": s.r?.[1] ?? "0deg",
            animation: `shape-travel ${s.duration}s linear infinite`,
            animationDelay: `-${s.delay}s`,
            willChange: "transform",
          } as React.CSSProperties;

          return (
            <div key={i} className={`absolute ${s.className ?? ""}`} style={style}>
              {s.node}
            </div>
          );
        })
      )}
    </div>
  );
}
