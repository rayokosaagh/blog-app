"use client";

import { ListChecks } from "lucide-react";

export interface EditorVerdict {
  /** Keyed by product slug — whichever side of the curated pair it belongs to. */
  [slug: string]: string;
}

/** Only the fields the summary needs; the compare page passes whole products. */
interface SummarisedProduct {
  slug: string;
  name: string;
}

/**
 * An editor's plain-language summary of the table below.
 *
 * Shows **only** what someone actually wrote, in the comparisons dashboard,
 * for this exact pair. No pairing gets an auto-generated summary: a sentence
 * assembled from spec deltas reads like an opinion, and attributing an opinion
 * to the publication that nobody at the publication held is worse than showing
 * nothing. Most of the pairings /compare allows will therefore have no summary,
 * and the spec table stands on its own.
 *
 * Rendered above the table rather than after it: the table runs to a dozen
 * screens, and a summary nobody scrolls to is a summary nobody reads.
 */
export default function ComparisonVerdict({
  products,
  editorVerdicts,
}: {
  products: SummarisedProduct[];
  editorVerdicts?: EditorVerdict;
}) {
  // Partial copy is fine and renders as far as it goes — an editor who only had
  // something to say about one side gets that one column, rather than being
  // forced to pad the other to make the card appear at all.
  const rows = products
    .map((p) => ({ ...p, summary: editorVerdicts?.[p.slug]?.trim() || null }))
    .filter((r): r is SummarisedProduct & { summary: string } => r.summary !== null);

  if (rows.length === 0) return null;

  return (
    <section
      aria-labelledby="comparison-summary-heading"
      // overflow-hidden matters in the modern theme: the section picks up the
      // theme radius from `border-4`, but the header strip below is a child
      // with its own background and square corners, which would otherwise
      // poke out through the rounded top edge.
      className="mb-8 overflow-hidden border-4 border-border-heavy bg-card shadow-brutal"
    >
      <div className="flex items-center gap-2 border-b-4 border-border-heavy bg-accent-2 px-4 py-2.5 text-on-accent-2">
        <ListChecks className="h-4 w-4 shrink-0" strokeWidth={2.5} />
        <h2
          id="comparison-summary-heading"
          className="text-[11px] font-extrabold uppercase tracking-[0.16em]"
        >
          Summary
        </h2>
      </div>

      {/* Column count follows the number of summaries, not a fixed 3 — the gap
          is a background colour showing through, so a spare track renders as a
          grey block rather than as nothing. */}
      <div
        className={`grid gap-px bg-border ${
          rows.length >= 3 ? "sm:grid-cols-2 lg:grid-cols-3" : rows.length === 2 ? "sm:grid-cols-2" : ""
        }`}
      >
        {rows.map((r) => (
          <div key={r.slug} className="flex flex-col gap-2 bg-card p-4">
            <h3 className="text-sm font-extrabold leading-snug text-foreground">{r.name}</h3>
            <p className="text-sm font-medium leading-relaxed text-muted-foreground">
              {r.summary}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
