// src/components/gadgets/compare/ToggleSwitch.tsx
"use client";
import { motion } from "framer-motion";

// Small animated on/off switch, reused for the two diff toggles. Renders
// as a self-contained "chip" that tints on activation, rather than a bare
// switch + label, for a more contemporary feel.
export default function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      whileTap={{ scale: 0.96 }}
      className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-medium transition-colors duration-300 ease-out ${
        checked
          ? "bg-accent/10 text-accent"
          : "text-muted-foreground hover:bg-border/30 hover:text-foreground"
      }`}
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-300 ease-out ${
          checked
            ? "bg-accent shadow-[0_0_0_1px_rgba(37,99,235,0.35),0_1px_4px_rgba(37,99,235,0.4)]"
            : "bg-border"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 600, damping: 32 }}
          className="h-3.5 w-3.5 rounded-full bg-white shadow-sm"
          style={{ marginLeft: checked ? "18px" : "3px" }}
        />
      </span>
      {label}
    </motion.button>
  );
}