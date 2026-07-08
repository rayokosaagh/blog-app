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
            {p.image && (
              <div className="mx-auto mb-1 h-20 w-20 flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <img src={p.image} alt={p.name} className="h-full w-full object-contain" />
              </div>
            )}
            {p.priceFrom && <p className="text-xs text-gray-500 dark:text-zinc-400">Starting from {p.priceFrom}</p>}
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">{p.name}</p>
          </div>
        ))}
      </div>

      {/* Toggles */}
      <div className="flex gap-4 justify-end my-3 text-sm text-zinc-700 dark:text-zinc-300">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={highlightDiff}
            onChange={(e) => setHighlightDiff(e.target.checked)}
            className="accent-blue-600 dark:accent-blue-400"
          />
          Highlight Differences
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={onlyDiff}
            onChange={(e) => setOnlyDiff(e.target.checked)}
            className="accent-blue-600 dark:accent-blue-400"
          />
          Show only Differences
        </label>
      </div>

      {/* Jump nav */}
      <nav className="flex gap-3 overflow-x-auto text-sm border-y border-zinc-200 dark:border-zinc-800 py-2 mb-4">
        {groups.map((g) => (
          
            key={g.title}
            href={`#${g.title.toLowerCase()}`}
            className="whitespace-nowrap text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            {g.title}
          </a>
        ))}
      </nav>

      {/* Grouped spec table */}
      <table className="w-full text-sm border-collapse">
        <tbody>
          {groups.map((g) => (
            <Fragment key={g.title}>
              <tr id={g.title.toLowerCase()} className="bg-gray-100 dark:bg-zinc-800">
                <td colSpan={products.length + 1} className="font-semibold p-2 text-zinc-900 dark:text-zinc-100">
                  {g.title}
                </td>
              </tr>
              {g.fields.map((f) => {
                const vals = products.map((p) => p.specs?.[f.key]);
                const differs = new Set(vals.map((v) => JSON.stringify(v))).size > 1;
                return (
                  <tr key={f.key} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="p-2 font-medium text-gray-600 dark:text-zinc-400">{f.label}</td>
                    {vals.map((v, i) => (
                      <td
                        key={i}
                        className={`p-2 whitespace-pre-line text-zinc-800 dark:text-zinc-100 ${
                          highlightDiff && differs ? "bg-yellow-50 dark:bg-yellow-400/10" : ""
                        }`}
                      >
                        {v === undefined || v === null || v === "" ? "—" : String(v)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}