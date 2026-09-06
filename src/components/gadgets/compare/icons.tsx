"use client";
import { motion } from "framer-motion";

export function ChevronIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.2 }}
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}

export function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

// Left/right arrow used by the scrollable spec jump nav.
export function ArrowIcon({ direction, className }: { direction: "left" | "right"; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path
        d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Maps a spec group's title to a small representative icon. Falls back to
// a generic list icon for unrecognized titles so new/custom groups still
// render something sensible.
export function GroupIcon({ title, className }: { title: string; className?: string }) {
  const key = title.trim().toLowerCase();
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, className };

  if (key.includes("general") || key.includes("information") || key.includes("overview")) {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8h.01M11 12h1v5h1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (key.includes("launch") || key.includes("release") || key.includes("availability")) {
    return (
      <svg {...common}>
        <path d="M12 2c2.5 2.5 4 6 4 9.5 0 1.6-.4 3-1 4.2l-3-1-3 1c-.6-1.2-1-2.6-1-4.2C8 8 9.5 4.5 12 2z" strokeLinejoin="round" />
        <path d="M9.5 15.5 7 21l3.5-1.5M14.5 15.5 17 21l-3.5-1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="10" r="1.5" />
      </svg>
    );
  }
  if (key.includes("body") || key.includes("design") || key.includes("build")) {
    return (
      <svg {...common}>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 18h2" strokeLinecap="round" />
      </svg>
    );
  }
  if (key.includes("performance") || key.includes("chip") || key.includes("processor")) {
    return (
      <svg {...common}>
        <rect x="6" y="6" width="12" height="12" rx="1.5" />
        <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" strokeLinecap="round" />
      </svg>
    );
  }
  if (key.includes("benchmark") || key.includes("score")) {
    return (
      <svg {...common}>
        <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
        <path d="M12 3v9l6-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (key.includes("display") || key.includes("screen")) {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" strokeLinecap="round" />
      </svg>
    );
  }
  if (key.includes("camera") || key.includes("photo")) {
    return (
      <svg {...common}>
        <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" strokeLinejoin="round" />
        <circle cx="12" cy="13.5" r="3.2" />
      </svg>
    );
  }
  if (key.includes("battery") || key.includes("power") || key.includes("charging")) {
    return (
      <svg {...common}>
        <rect x="2" y="7" width="18" height="10" rx="1.5" />
        <path d="M22 10v4" strokeLinecap="round" />
        <path d="M6 10v4M10 10v4" strokeLinecap="round" />
      </svg>
    );
  }
  if (key.includes("connectiv") || key.includes("network") || key.includes("wireless")) {
    return (
      <svg {...common}>
        <path d="M5 12.5a10 10 0 0 1 14 0" strokeLinecap="round" />
        <path d="M8 15.5a6 6 0 0 1 8 0" strokeLinecap="round" />
        <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (key.includes("storage") || key.includes("memory") || key.includes("ram")) {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 15h.01M12 15h.01" strokeLinecap="round" />
      </svg>
    );
  }
  if (key.includes("audio") || key.includes("sound") || key.includes("speaker")) {
    return (
      <svg {...common}>
        <path d="M5 9v6h4l5 4V5L9 9H5z" strokeLinejoin="round" />
        <path d="M17.5 9a4.5 4.5 0 0 1 0 6" strokeLinecap="round" />
      </svg>
    );
  }
  if (key.includes("biometric") || key.includes("fingerprint") || key.includes("face unlock") || key.includes("security")) {
    return (
      <svg {...common}>
        <path d="M12 3a6 6 0 0 0-6 6c0 3-1 5-2 6.5" strokeLinecap="round" />
        <path d="M12 3a6 6 0 0 1 6 6c0 1.2-.1 2.2-.3 3.1" strokeLinecap="round" />
        <path d="M8.5 20c1-1.2 1.7-2.3 2.1-3.5M12 9a3 3 0 0 1 3 3c0 3-1 5.5-2.5 7.5" strokeLinecap="round" />
        <path d="M9 9a3 3 0 0 1 3-3" strokeLinecap="round" />
        <path d="M12 12v1.5c0 2-.5 3.7-1.4 5.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (key.includes("sensor")) {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M4.5 12a7.5 7.5 0 0 1 15 0M2 12a10 10 0 0 1 20 0" strokeLinecap="round" />
      </svg>
    );
  }
  if (key.includes("price") || key.includes("value")) {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M15 9.5a2.5 2.5 0 0 0-2.5-1.5h-1a2 2 0 1 0 0 4h1a2 2 0 1 1 0 4h-1a2.5 2.5 0 0 1-2.5-1.5M12 6.5v1M12 16.5v1" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
    </svg>
  );
}

// Per-field icons for specific benchmark rows (Antutu, GeekBench, 3DMark)
// inside the "Benchmark" group. Keyed off the field's `key`, not its
// label, so it's independent of display text. Returns null for any other
// field so it's safe to render unconditionally next to every spec label.
export function BenchmarkFieldIcon({ fieldKey, className }: { fieldKey: string; className?: string }) {
  const key = fieldKey.trim().toLowerCase();
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, className };

  if (key === "antutu") {
    return (
      <svg {...common}>
        <path d="M12 3v6M12 15v6M4.2 7.8l5.2 3M14.6 13.2l5.2 3M4.2 16.2l5.2-3M14.6 10.8l5.2-3" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2.4" />
      </svg>
    );
  }
  if (key === "geekbench") {
    return (
      <svg {...common}>
        <rect x="4" y="10" width="4" height="10" rx="1" />
        <rect x="10" y="5" width="4" height="15" rx="1" />
        <rect x="16" y="13" width="4" height="7" rx="1" />
      </svg>
    );
  }
  if (key === "3dmark") {
    return (
      <svg {...common}>
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" strokeLinejoin="round" />
        <path d="M12 3v9M12 12l8-4.5M12 12l-8-4.5" strokeLinejoin="round" />
      </svg>
    );
  }
  return null;
}