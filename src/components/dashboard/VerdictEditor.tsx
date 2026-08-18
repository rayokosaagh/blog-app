"use client";

import { Award, Plus, Trash2 } from "lucide-react";
import { VERDICT_MAX, verdictBand, type SubScore } from "@/lib/verdict";

export interface VerdictDraft {
  /** Kept as a string so the field can be genuinely empty — 0 is a real score. */
  score: string;
  summary: string;
  subScores: { label: string; score: string }[];
}

export const EMPTY_VERDICT: VerdictDraft = { score: "", summary: "", subScores: [] };

/** Hydrates the form from an existing post's columns. */
export function verdictDraftFromPost(post: {
  verdictScore?: number | null;
  verdictSummary?: string | null;
  verdictSubScores?: unknown;
}): VerdictDraft {
  const rows = Array.isArray(post.verdictSubScores) ? post.verdictSubScores : [];
  return {
    score: post.verdictScore != null ? String(post.verdictScore) : "",
    summary: post.verdictSummary ?? "",
    subScores: rows
      .filter((r): r is { label: string; score: number } => !!r && typeof r === "object")
      .map((r) => ({ label: String(r.label ?? ""), score: String(r.score ?? "") })),
  };
}

/** Shapes the draft for the posts API. Empty rows are dropped, not sent as 0. */
export function verdictPayload(draft: VerdictDraft) {
  const score = draft.score.trim() === "" ? null : Number(draft.score);
  return {
    verdictScore: Number.isFinite(score as number) ? score : null,
    verdictSummary: draft.summary,
    verdictSubScores: draft.subScores
      .filter((s) => s.label.trim() && s.score.trim() !== "")
      .map((s): SubScore => ({ label: s.label.trim(), score: Number(s.score) })),
  };
}

// The axes most reviews end up using. Offered as one-tap adds so scores stay
// consistent between posts — inconsistent labels make them incomparable, which
// defeats the point of scoring at all.
const SUGGESTED = ["Design", "Display", "Performance", "Camera", "Battery", "Software", "Value"];

const input =
  "w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all";
const label = "block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5";

export default function VerdictEditor({
  value,
  onChange,
}: {
  value: VerdictDraft;
  onChange: (next: VerdictDraft) => void;
}) {
  const parsed = value.score.trim() === "" ? null : Number(value.score);
  const showBand = parsed !== null && Number.isFinite(parsed) && parsed >= 0 && parsed <= VERDICT_MAX;

  function setRow(idx: number, patch: Partial<{ label: string; score: string }>) {
    onChange({
      ...value,
      subScores: value.subScores.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    });
  }

  function addRow(presetLabel = "") {
    onChange({ ...value, subScores: [...value.subScores, { label: presetLabel, score: "" }] });
  }

  const used = new Set(value.subScores.map((s) => s.label.toLowerCase()));

  // The half-filled state is the one worth calling out: numbers entered, no
  // words, and the card silently doesn't render. Without this the editor's
  // only clue is an empty spot on the published page.
  const hasNumbers =
    value.score.trim() !== "" || value.subScores.some((s) => s.score.trim() !== "");
  const missingSummary = hasNumbers && value.summary.trim() === "";

  return (
    <section className="rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
      <header className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/40 px-5 py-4">
        <span className="h-9 w-9 shrink-0 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
          <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Editorial verdict
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Optional, and all-or-nothing: the card shows only when you write a
            bottom line <em>and</em> give a score. Leave both blank on news
            posts. Filled in, the post also becomes eligible for a review
            snippet in search.
          </p>
        </div>
      </header>

      <div className="p-5 space-y-5">
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <div>
            <label className={label} htmlFor="verdict-score">
              Score (0–{VERDICT_MAX})
            </label>
            <div className="flex items-center gap-2">
              <input
                id="verdict-score"
                type="number"
                min={0}
                max={VERDICT_MAX}
                step={0.1}
                value={value.score}
                onChange={(e) => onChange({ ...value, score: e.target.value })}
                placeholder="—"
                className={input}
              />
            </div>
            {showBand && (
              <p className="mt-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                {verdictBand(parsed!)}
              </p>
            )}
          </div>

          <div>
            <label className={label} htmlFor="verdict-summary">
              Bottom line
            </label>
            <textarea
              id="verdict-summary"
              rows={3}
              value={value.summary}
              onChange={(e) => onChange({ ...value, summary: e.target.value })}
              placeholder="One or two sentences a reader could quote."
              className={`${input} resize-y ${
                missingSummary ? "border-amber-400 dark:border-amber-500/60" : ""
              }`}
              aria-describedby={missingSummary ? "verdict-summary-warning" : undefined}
            />
            {missingSummary && (
              <p
                id="verdict-summary-warning"
                className="mt-1.5 text-xs font-medium text-amber-600 dark:text-amber-400"
              >
                Write a bottom line, or the verdict card won&apos;t appear —
                scores alone aren&apos;t published.
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className={`${label} mb-0`}>Sub-scores</span>
            <button
              type="button"
              onClick={() => addRow()}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Add row
            </button>
          </div>

          {value.subScores.length > 0 && (
            <ul className="space-y-2 mb-3">
              {value.subScores.map((s, i) => (
                <li key={i} className="flex items-center gap-2">
                  <input
                    aria-label={`Sub-score ${i + 1} label`}
                    value={s.label}
                    onChange={(e) => setRow(i, { label: e.target.value })}
                    placeholder="Camera"
                    className={`${input} flex-1`}
                  />
                  <input
                    aria-label={`Sub-score ${i + 1} value`}
                    type="number"
                    min={0}
                    max={VERDICT_MAX}
                    step={0.1}
                    value={s.score}
                    onChange={(e) => setRow(i, { score: e.target.value })}
                    placeholder="8.5"
                    className={`${input} w-24 shrink-0`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...value,
                        subScores: value.subScores.filter((_, idx) => idx !== i),
                      })
                    }
                    aria-label={`Remove ${s.label || "row"}`}
                    className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED.filter((s) => !used.has(s.toLowerCase())).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addRow(s)}
                className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>

          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            Leave the overall score blank and it&apos;s averaged from these instead.
          </p>
        </div>
      </div>
    </section>
  );
}
