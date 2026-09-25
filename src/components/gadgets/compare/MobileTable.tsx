"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BenchmarkFieldIcon, GroupIcon } from "./icons";
import { Product, SpecGroupLike } from "./types";
import { isSpecEmpty } from "@/lib/gadgets/formatSpecValue";
import { LABEL_COL_PX, ZEBRA, cellText, mobileMinWidth, productAccent } from "./columns";

export default function MobileTable({
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
    <div className="sm:hidden relative z-0 overflow-x-auto rounded-none border-2 border-border-heavy -mx-4">
      {/* Fixed layout on shared widths (see DesktopTable); the min-width
          keeps 3+ products scrolling sideways rather than squeezed. */}
      <table
        className="w-full table-fixed text-xs border-collapse"
        style={{ minWidth: mobileMinWidth(filledProducts.length) }}
      >
        <colgroup>
          <col style={{ width: LABEL_COL_PX.mobile }} />
          {filledProducts.map((p) => (
            <col key={p.id} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-card border-b-2 border-border-heavy">
            <th className="sticky left-0 bg-card border-r-2 border-border-heavy p-2 text-left font-extrabold uppercase tracking-wide text-[10px] text-muted-foreground z-10 min-w-[90px] max-w-[110px]">
              Spec
            </th>
            {filledProducts.map((p, i) => (
              <th
                key={p.id}
                className={`p-2 text-left font-extrabold text-foreground truncate max-w-[110px] min-w-[100px] ${productAccent(i).bar}`}
              >
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
                    id={`m-${g.title.toLowerCase()}`}
                    style={{ scrollMarginTop: headerOffset + 12 }}
                    className={`transition-colors duration-100 ${isActiveGroup ? "bg-accent/25" : "bg-accent/15"}`}
                  >
                    {/* Same banding as DesktopTable: every header washed, the
                        one in view a shade deeper with accent text. */}
                    <td
                      colSpan={filledProducts.length + 1}
                      className={`font-extrabold uppercase tracking-wide text-[10px] p-2 shadow-[inset_4px_0_0_var(--accent)] ${
                        isActiveGroup ? "text-accent" : "text-foreground"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <GroupIcon title={g.title} className="h-3.5 w-3.5 shrink-0" />
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
                        className={`border-b-2 border-border active:bg-accent-tint ${
                          isFocused ? "bg-accent-tint border-l-4 border-l-accent" : `border-l-4 border-l-transparent ${zebra ? ZEBRA.row : ""}`
                        }`}
                      >
                        <td
                          className={`sticky left-0 border-r-2 border-border-heavy p-2 font-bold text-muted-foreground min-w-[90px] max-w-[110px] ${
                            isFocused ? "bg-accent-tint" : zebra ? ZEBRA.label : "bg-card"
                          }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            <BenchmarkFieldIcon fieldKey={f.key} className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="leading-tight">
                              {f.label}
                              {f.unit ? <span className="text-muted-foreground"> ({f.unit})</span> : null}
                            </span>
                          </span>
                        </td>
                        {filledProducts.map((p, i) => {
                          const v = vals[i];
                          const empty = isSpecEmpty(v);
                          return (
                            <td
                              key={p.id}
                              // Wash only on highlighted (differing) rows — see DesktopTable.
                              className={`p-2 whitespace-pre-line min-w-[100px] max-w-[110px] transition-colors duration-200 ${productAccent(i).bar} ${markDiff ? productAccent(i).wash : ""}`}
                            >
                              {/* Plain text, as in DesktopTable: Highlight only
                                  changes weight. */}
                              <span
                                className={`text-xs leading-snug ${
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