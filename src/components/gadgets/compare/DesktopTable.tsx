// src/components/gadgets/compare/DesktopTable.tsx
"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BenchmarkFieldIcon, GroupIcon } from "./icons";
import { Product, SpecGroupLike } from "./types";
import { isSpecEmpty } from "@/lib/gadgets/formatSpecValue";

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
    <div className="hidden sm:block relative z-0 overflow-x-auto rounded-none border-2 border-border-heavy">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-card border-b-2 border-border-heavy">
            <th className="sticky left-0 bg-card border-r-2 border-border-heavy p-3 text-left font-extrabold uppercase tracking-wide text-xs text-muted-foreground z-10">
              Spec
            </th>
            {filledProducts.map((p) => (
              <th key={p.id} className="p-3 text-left font-extrabold text-foreground truncate max-w-[160px]">
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {groups.map((g) => {
              const isActiveGroup = activeGroupTitle === g.title;
              return (
                <React.Fragment key={g.title}>
                  <motion.tr
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    id={g.title.toLowerCase()}
                    style={{ scrollMarginTop: headerOffset + 12 }}
                    className={`transition-colors duration-100 ${
                      isActiveGroup ? "bg-accent-tint" : "bg-card"
                    }`}
                  >
                    <td
                      colSpan={filledProducts.length + 1}
                      className={`font-extrabold uppercase tracking-wide text-xs p-3 border-l-4 ${
                        isActiveGroup ? "border-l-accent text-accent" : "border-l-transparent text-foreground"
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
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={() => onToggleFocus(f.key)}
                        className={`border-b-2 border-border cursor-pointer transition-colors duration-100 hover:bg-accent-tint ${
                          isFocused ? "bg-accent-tint border-l-4 border-l-accent" : "border-l-4 border-l-transparent"
                        }`}
                      >
                        <td
                          className={`sticky left-0 border-r-2 border-border-heavy p-3 font-bold text-muted-foreground ${
                            isFocused ? "bg-accent-tint" : "bg-card"
                          }`}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <BenchmarkFieldIcon fieldKey={f.key} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            {f.label}
                            {f.unit ? <span className="text-muted-foreground"> ({f.unit})</span> : null}
                          </span>
                        </td>
                        {filledProducts.map((p, i) => {
                          const v = vals[i];
                          const empty = isSpecEmpty(v);
                          return (
                            <td key={p.id} className="p-3 whitespace-pre-line">
                              {/*
                                One span in both states, with the badge's box
                                metrics always applied and only its colours
                                toggling. Swapping between a bare span and a
                                bordered/padded one changed every differing
                                cell's size, so flipping Highlight reflowed row
                                heights and column widths — that jolt was the
                                "wacky" part, not the transition itself.
                                Applied to every value cell, not just differing
                                ones, so columns stay aligned.
                              */}
                              <span
                                className={`inline-flex items-center rounded-none border-2 px-2 py-0.5 font-semibold transition-colors duration-200 ease-out ${
                                  highlightDiff && differs && !empty
                                    ? "border-border-heavy bg-accent-2 text-on-accent-2"
                                    : `border-transparent ${
                                        empty ? "text-muted-foreground" : "text-foreground"
                                      }`
                                }`}
                              >
                                {empty ? "—" : String(v)}
                              </span>
                            </td>
                          );
                        })}
                      </motion.tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}