"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BenchmarkFieldIcon, GroupIcon } from "./icons";
import { Product, SpecGroupLike } from "./types";
import { isSpecEmpty } from "@/lib/gadgets/formatSpecValue";
import { LABEL_COL_PX, ZEBRA, cellText, productAccent } from "./columns";

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
  // No blank column for a free slot: the product columns take the full
  // width, and "+ Add" lives in the sticky bar's chip row instead.
  const columnCount = filledProducts.length + 1;
  return (
    <div className="hidden sm:block relative z-0 overflow-x-auto rounded-none border-2 border-border-heavy">
      {/* Fixed layout on shared widths so the sticky CompactCompareBar's
          product cells line up with these columns. */}
      <table className="w-full table-fixed text-sm border-collapse">
        <colgroup>
          <col style={{ width: LABEL_COL_PX.desktop }} />
          {filledProducts.map((p) => (
            <col key={p.id} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-card border-b-2 border-border-heavy">
            <th className="sticky left-0 bg-card border-r-2 border-border-heavy p-3 text-left font-extrabold uppercase tracking-wide text-xs text-muted-foreground z-10">
              Spec
            </th>
            {filledProducts.map((p, i) => (
              <th key={p.id} className={`p-3 text-left font-extrabold text-foreground truncate ${productAccent(i).bar}`}>
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
                    className={`transition-colors duration-100 ${isActiveGroup ? "bg-accent/25" : "bg-accent/15"}`}
                  >
                    {/* Every section header carries the accent wash and bar so
                        the table reads as banded sections; the one in view is
                        a shade deeper, with accent text. The bar is an inset
                        shadow because the modern theme thins border-l-4. */}
                    <td
                      colSpan={columnCount}
                      className={`font-extrabold uppercase tracking-wide text-xs p-3 shadow-[inset_4px_0_0_var(--accent)] ${
                        isActiveGroup ? "text-accent" : "text-foreground"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <GroupIcon title={g.title} className="h-4 w-4 shrink-0" />
                        {g.title}
                      </span>
                    </td>
                  </motion.tr>
                  {g.fields.map((f, rowIndex) => {
                    const vals = filledProducts.map((p) => p.specs?.[f.key]);
                    const differs = new Set(vals.map((v) => JSON.stringify(v))).size > 1;
                    const isFocused = focusedKey === f.key;
                    const isDimmed = focusedKey !== null && !isFocused;
                    const zebra = rowIndex % 2 === 1;
                    const markDiff = highlightDiff && differs;
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
                          isFocused ? "bg-accent-tint border-l-4 border-l-accent" : `border-l-4 border-l-transparent ${zebra ? ZEBRA.row : ""}`
                        }`}
                      >
                        <td
                          className={`sticky left-0 border-r-2 border-border-heavy p-3 font-bold text-muted-foreground ${
                            isFocused ? "bg-accent-tint" : zebra ? ZEBRA.label : "bg-card"
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
                          // The bar keys every cell to its product column. The
                          // wash is the Highlight: it only tints rows where the
                          // products differ, so matching rows stay plain.
                          return (
                            <td
                              key={p.id}
                              className={`p-3 whitespace-pre-line transition-colors duration-200 ${productAccent(i).bar} ${markDiff ? productAccent(i).wash : ""}`}
                            >
                              {/* Plain text in both states: weight is the only
                                  thing Highlight changes, so rows never reflow
                                  their box metrics when it's flipped. */}
                              <span
                                className={`text-sm leading-relaxed ${
                                  empty
                                    ? "text-muted-foreground"
                                    : markDiff
                                      ? "font-bold text-foreground"
                                      : "font-medium text-foreground"
                                }`}
                              >
                                {empty ? "—" : cellText(f, v)}
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