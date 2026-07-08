// src/components/gadgets/compare/FocusedSpecBar.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { SpecField } from "@/lib/gadgets/types";
import { Product } from "./types";

// Clicking a spec row "zooms" into it: dims every other row and pops this
// large-format comparison bar above the table. Lives inside the sticky
// header (like the jump nav) so it stays pinned on screen.
export default function FocusedSpecBar({
  focusedField,
  focusedKey,
  filledProducts,
  onClear,
}: {
  focusedField: SpecField | undefined;
  focusedKey: string | null;
  filledProducts: Product[];
  onClear: () => void;
}) {
  return (
    <AnimatePresence>
      {focusedField && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: "auto", marginTop: 12 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                Focused spec{focusedField.unit ? ` · ${focusedField.unit}` : ""}
              </p>
              <button
                type="button"
                onClick={onClear}
                className="h-6 w-6 flex items-center justify-center rounded-full bg-card/80 text-muted-foreground hover:text-red-500 text-sm leading-none"
                aria-label="Clear focused spec"
              >
                ×
              </button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={focusedKey}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="text-lg font-bold text-foreground mb-3">{focusedField.label}</p>
                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: `repeat(${filledProducts.length}, minmax(0,1fr))` }}
                >
                  {filledProducts.map((p) => {
                    const v = p.specs?.[focusedField.key];
                    return (
                      <motion.div
                        key={p.id}
                        layout
                        className="rounded-xl p-3 text-center border border-border bg-card"
                      >
                        <p className="text-xs text-muted-foreground truncate mb-1">{p.name}</p>
                        <p className="text-xl font-bold text-foreground">
                          {v === undefined || v === null || v === "" ? "—" : String(v)}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}