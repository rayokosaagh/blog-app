// src/components/gadgets/compare/MobileTable.tsx
"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BenchmarkFieldIcon, GroupIcon } from "./icons";
import { Product, SpecGroupLike } from "./types";

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
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-card border-b-2 border-border-heavy">
            <th className="sticky left-0 bg-card border-r-2 border-border-heavy p-2 text-left font-extrabold uppercase tracking-wide text-[10px] text-muted-foreground z-10 min-w-[90px] max-w-[110px]">
              Spec
            </th>
            {filledProducts.map((p) => (
              <th
                key={p.id}
                className="p-2 text-left font-extrabold text-foreground truncate max-w-[110px] min-w-[100px]"
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
                    className={`transition-colors duration-100 ${
                      isActiveGroup ? "bg-accent-tint" : "bg-card"
                    }`}
                  >
                    <td
                      colSpan={filledProducts.length + 1}
                      className={`font-extrabold uppercase tracking-wide text-[10px] p-2 border-l-4 ${
                        isActiveGroup ? "border-l-accent text-accent" : "border-l-transparent text-foreground"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <GroupIcon title={g.title} className="h-3.5 w-3.5 shrink-0" />
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
                        className={`border-b-2 border-border active:bg-accent-tint ${
                          isFocused ? "bg-accent-tint border-l-4 border-l-accent" : "border-l-4 border-l-transparent"
                        }`}
                      >
                        <td
                          className={`sticky left-0 border-r-2 border-border-heavy p-2 font-bold text-muted-foreground min-w-[90px] max-w-[110px] ${
                            isFocused ? "bg-accent-tint" : "bg-card"
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
                          const empty = v === undefined || v === null || v === "";
                          return (
                            <td key={p.id} className="p-2 whitespace-pre-line min-w-[100px] max-w-[110px]">
                              {highlightDiff && differs && !empty ? (
                                <span className="inline-flex items-center rounded-none border-2 border-border-heavy bg-accent-2 text-on-accent-2 font-extrabold px-1.5 py-0.5 text-[11px]">
                                  {String(v)}
                                </span>
                              ) : (
                                <span className={empty ? "text-muted-foreground" : "text-foreground"}>
                                  {empty ? "—" : String(v)}
                                </span>
                              )}
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