// src/components/gadgets/compare/DesktopTable.tsx
"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BenchmarkFieldIcon, GroupIcon } from "./icons";
import { Product, SpecGroupLike } from "./types";

export default function DesktopTable({
  groups,
  filledProducts,
  activeGroupTitle,
  focusedKey,
  headerOffset,
  highlightDiff,
  onToggleFocus,
}: {
  groups: SpecGroupLike[];
  filledProducts: Product[];
  activeGroupTitle: string | null;
  focusedKey: string | null;
  headerOffset: number;
  highlightDiff: boolean;
  onToggleFocus: (key: string) => void;
}) {
  return (
    <div className="hidden sm:block relative z-0 overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-card/80 backdrop-blur">
            <th className="sticky left-0 bg-card/80 backdrop-blur p-3 text-left font-semibold text-muted-foreground z-10">
              Spec
            </th>
            {filledProducts.map((p) => (
              <th key={p.id} className="p-3 text-left font-semibold text-foreground truncate max-w-[160px]">
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {groups.map((g) => (
              <React.Fragment key={g.title}>
                <motion.tr
                  layout
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    backgroundColor:
                      activeGroupTitle === g.title
                        ? ["rgba(91,157,255,0.22)", "rgba(91,157,255,0.06)"]
                        : undefined,
                  }}
                  exit={{ opacity: 0 }}
                  transition={
                    activeGroupTitle === g.title
                      ? { backgroundColor: { duration: 0.9, ease: "easeOut" }, opacity: { duration: 0.2 } }
                      : { duration: 0.2 }
                  }
                  id={g.title.toLowerCase()}
                  style={{ scrollMarginTop: headerOffset + 12 }}
                  className={
                    activeGroupTitle === g.title
                      ? "!bg-accent/10"
                      : "bg-card transition-colors duration-300"
                  }
                >
                  <td
                    colSpan={filledProducts.length + 1}
                    className={`font-semibold p-3 border-l-2 ${
                      activeGroupTitle === g.title
                        ? "border-accent text-accent"
                        : "border-transparent text-foreground"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <GroupIcon title={g.title} className="h-4 w-4 shrink-0" />
                      {g.title}
                    </span>
                  </td>
                </motion.tr>
                {g.fields.map((f) => {
                  const vals = filledProducts.map((p) => p.specs?.[f.key]);
                  const differs = new Set(vals.map((v) => JSON.stringify(v))).size > 1;
                  const isFocused = focusedKey === f.key;
                  const isDimmed = focusedKey !== null && !isFocused;
                  return (
                    <motion.tr
                      key={f.key}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isDimmed ? 0.35 : 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => onToggleFocus(f.key)}
                      className={`border-b border-border/60 cursor-pointer transition-colors hover:bg-accent/5 ${
                        isFocused ? "ring-1 ring-inset ring-accent/50 bg-accent/10" : ""
                      }`}
                    >
                      <td className={`sticky left-0 p-3 font-medium text-muted-foreground ${isFocused ? "bg-accent/10" : "bg-card"}`}>
                        <span className="inline-flex items-center gap-1.5">
                          <BenchmarkFieldIcon fieldKey={f.key} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {f.label}
                          {f.unit ? <span className="text-muted-foreground/70"> ({f.unit})</span> : null}
                        </span>
                      </td>
                      {filledProducts.map((p, i) => {
                        const v = vals[i];
                        return (
                          <td key={p.id} className="p-3 whitespace-pre-line">
                            <span
                              className={`inline-flex items-center rounded-md transition-colors duration-300 ease-out ${
                                highlightDiff && differs
                                  ? "pl-2.5 pr-2.5 py-1 -ml-px border-l-2 border-amber-500 dark:border-amber-400 bg-amber-500/[0.07] dark:bg-amber-400/[0.09] text-amber-950 dark:text-amber-100 font-semibold"
                                  : "text-foreground"
                              }`}
                            >
                              {v === undefined || v === null || v === "" ? "—" : String(v)}
                            </span>
                          </td>
                        );
                      })}
                    </motion.tr>
                  );
                })}
              </React.Fragment>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}