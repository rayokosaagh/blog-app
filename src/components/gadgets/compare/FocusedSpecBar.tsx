"use client";
import { motion, AnimatePresence } from "framer-motion";
import { SpecField } from "@/lib/gadgets/types";
import { Product } from "./types";
import { isSpecEmpty } from "@/lib/gadgets/formatSpecValue";

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
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="rounded-none border-2 border-border-heavy bg-card p-4 shadow-brutal-lg overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-accent">
                Focused spec{focusedField.unit ? ` · ${focusedField.unit}` : ""}
              </p>
              <button
                type="button"
                onClick={onClear}
                className="h-6 w-6 flex items-center justify-center rounded-none border-2 border-transparent text-muted-foreground hover:text-on-accent-2 hover:bg-accent-2 hover:border-border-heavy transition-colors duration-100 text-sm leading-none"
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
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <p className="text-lg font-extrabold text-foreground mb-3">{focusedField.label}</p>
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
                        className="rounded-none p-3 text-center border-2 border-border-heavy bg-card"
                      >
                        <p className="text-xs text-muted-foreground truncate mb-1">{p.name}</p>
                        <p className="text-xl font-extrabold text-foreground">
                          {isSpecEmpty(v) ? "—" : String(v)}
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