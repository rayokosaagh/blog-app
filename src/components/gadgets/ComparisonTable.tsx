// src/components/gadgets/ComparisonTable.tsx
"use client";
import { Fragment, useMemo, useState } from "react";
import { GadgetCategoryDef } from "@/lib/gadgets/types";

interface Product { id: string; slug: string; name: string; brand: string; image?: string | null; priceFrom?: number | null; specs: Record<string, any>; }

export default function ComparisonTable({
  def,
  products,
  category,
}: { def: GadgetCategoryDef; products: Product[]; category: string }) {
  const [highlightDiff, setHighlightDiff] = useState(false);
  const [onlyDiff, setOnlyDiff] = useState(false);

  const groups = useMemo(() => {
    if (!onlyDiff) return def.groups;
    return def.groups
      .map((g) => ({
        ...g,
        fields: g.fields.filter((f) => {
          const vals = products.map((p) => JSON.stringify(p.specs?.[f.key] ?? null));
          return new Set(vals).size > 1; // keep only fields that differ
        }),
      }))
      .filter((g) => g.fields.length > 0);
  }, [onlyDiff, def.groups, products]);

  return (
    <div>
      {/* Header: images, names, prices */}
      <div className="grid" style={{ gridTemplateColumns: `160px repeat(${products.length}, 1fr)` }}>
        <div />
        {products.map((p) => (
          <div key={p.id} className="text-center px-2">
            <div className="mx-auto mb-1 h-20 w-20 flex items-center justify-center rounded-none border-2 border-border-heavy bg-accent-tint">
              {p.image ? (
                <img loading="lazy" decoding="async" src={p.image} alt={p.name} className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                  {p.brand?.slice(0, 2)}
                </span>
              )}
            </div>
            {p.priceFrom && (
              <p className="text-xs font-bold text-muted-foreground">Starting from {p.priceFrom}</p>
            )}
            <p className="font-extrabold text-foreground">{p.name}</p>
          </div>
        ))}
      </div>

      {/* Toggles */}
      <div className="flex gap-4 justify-end my-3 text-xs font-bold uppercase tracking-wide text-foreground">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={highlightDiff}
            onChange={(e) => setHighlightDiff(e.target.checked)}
            className="accent-[var(--accent)] w-4 h-4 rounded-none border-2 border-border-heavy"
          />
          Highlight Differences
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyDiff}
            onChange={(e) => setOnlyDiff(e.target.checked)}
            className="accent-[var(--accent)] w-4 h-4 rounded-none border-2 border-border-heavy"
          />
          Show only Differences
        </label>
      </div>

      {/* Jump nav */}
      <nav className="flex gap-2 overflow-x-auto scrollbar-hide border-y-2 border-border-heavy py-2 mb-4">
        {groups.map((g) => (
          <a
            key={g.title}
            href={`#${g.title.toLowerCase()}`}
            className="tag-pill brutal-press whitespace-nowrap shrink-0 bg-card text-foreground hover:bg-accent-2 hover:text-on-accent-2 transition-colors duration-100"
          >
            {g.title}
          </a>
        ))}
      </nav>

      {/* Grouped spec table */}
      <div className="table-wrap">
        <table className="w-full text-sm border-collapse">
          <tbody>
            {groups.map((g) => (
              <Fragment key={g.title}>
                <tr id={g.title.toLowerCase()} className="bg-muted border-y-2 border-border-heavy">
                  <td colSpan={products.length + 1} className="font-extrabold uppercase tracking-wide text-xs p-2 text-foreground">
                    {g.title}
                  </td>
                </tr>
                {g.fields.map((f) => {
                  const vals = products.map((p) => p.specs?.[f.key]);
                  const differs = new Set(vals.map((v) => JSON.stringify(v))).size > 1;
                  return (
                    <tr key={f.key} className="border-b-2 border-border">
                      <td className="p-2 font-bold text-muted-foreground">{f.label}</td>
                      {vals.map((v, i) => {
                        const empty = v === undefined || v === null || v === "";
                        return (
                          <td
                            key={i}
                            className={`p-2 whitespace-pre-line ${
                              empty ? "text-muted-foreground" : "text-foreground"
                            } ${highlightDiff && differs ? "bg-accent-tint" : ""}`}
                          >
                            {empty ? "—" : String(v)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}