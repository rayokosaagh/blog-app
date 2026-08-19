// src/components/gadgets/compare/MobileGroups.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { BenchmarkFieldIcon, ChevronIcon, GroupIcon } from "./icons";
import { Product, SpecGroupLike } from "./types";
import { isSpecEmpty } from "@/lib/gadgets/formatSpecValue";

export default function MobileGroups({
  groups,
  filledProducts,
  openMobileGroups,
  onToggleMobileGroup,
  fieldFilterActive,
  activeGroupTitle,
  onSetActiveGroup,
  focusedKey,
  onToggleFocus,
  highlightDiff,
  headerOffset,
}: {
  groups: SpecGroupLike[];
  filledProducts: Product[];
  openMobileGroups: Set<string>;
  onToggleMobileGroup: (title: string) => void;
  fieldFilterActive: boolean;
  activeGroupTitle: string | null;
  onSetActiveGroup: (title: string) => void;
  focusedKey: string | null;
  onToggleFocus: (key: string) => void;
  highlightDiff: boolean;
  headerOffset: number;
}) {
  return (
    <div className="sm:hidden space-y-3">
      {groups.map((g) => {
        const isOpen = openMobileGroups.has(g.title) || fieldFilterActive;
        return (
          <div
            key={g.title}
            id={`m-${g.title.toLowerCase()}`}
            style={{ scrollMarginTop: headerOffset + 12 }}
            className="rounded-xl border border-border overflow-hidden"
          >
            <motion.button
              type="button"
              onClick={() => {
                onToggleMobileGroup(g.title);
                onSetActiveGroup(g.title);
              }}
              animate={{
                backgroundColor:
                  activeGroupTitle === g.title
                    ? ["rgba(91,157,255,0.22)", "rgba(91,157,255,0.06)"]
                    : undefined,
              }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className={`w-full flex items-center justify-between p-3 text-left border-l-2 ${
                activeGroupTitle === g.title
                  ? "!bg-accent/10 border-accent"
                  : "bg-card border-transparent transition-colors duration-300"
              }`}
            >
              <span className={`flex items-center gap-2 font-semibold text-sm ${activeGroupTitle === g.title ? "text-accent" : "text-foreground"}`}>
                <GroupIcon title={g.title} className="h-4 w-4 shrink-0" />
                {g.title}
              </span>
              <ChevronIcon open={isOpen} className="h-4 w-4 text-muted-foreground" />
            </motion.button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {g.fields.map((f) => {
                    const isFocused = focusedKey === f.key;
                    const fieldVals = filledProducts.map((p) => JSON.stringify(p.specs?.[f.key] ?? null));
                    const fieldDiffers = new Set(fieldVals).size > 1;
                    return (
                      <div
                        key={f.key}
                        onClick={() => onToggleFocus(f.key)}
                        className={`p-3 border-t border-border/60 cursor-pointer ${
                          isFocused ? "bg-accent/10" : ""
                        }`}
                      >
                        <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <BenchmarkFieldIcon fieldKey={f.key} className="h-3.5 w-3.5 shrink-0" />
                          {f.label}{f.unit ? ` (${f.unit})` : ""}
                        </p>
                        <div className="space-y-1.5">
                          {filledProducts.map((p) => {
                            const v = p.specs?.[f.key];
                            return (
                              <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                                <span className="text-muted-foreground truncate">{p.name}</span>
                                <span
                                  className={`inline-flex items-center rounded-md transition-colors duration-300 ease-out ${
                                    highlightDiff && fieldDiffers
                                      ? "pl-2.5 pr-2.5 py-1 -mr-px border-r-2 border-amber-500 dark:border-amber-400 bg-amber-500/[0.07] dark:bg-amber-400/[0.09] text-amber-950 dark:text-amber-100 font-semibold"
                                      : "text-foreground"
                                  }`}
                                >
                                  {isSpecEmpty(v) ? "—" : String(v)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}