/**
 * Editorial verdict — the reviewer's own score for a post.
 *
 * Distinct from `Rating`, which is the readers' score. Both can appear on the
 * same article; this one is written in the dashboard and is what goes into the
 * Review structured data, so it's the number that can show up in a search
 * result.
 *
 * Lives in `src/lib` (not next to the component) because the article page is a
 * Server Component and the dashboard form is a Client Component — a shared
 * function exported from a "use client" module arrives at the server as an
 * uncallable proxy. See AGENTS.md.
 */

export const VERDICT_MAX = 10;

// A type alias rather than an interface on purpose: Prisma's `InputJsonValue`
// is structural, and TypeScript only gives object *type aliases* an implicit
// index signature. As an interface this is unassignable to a Json column, and
// the error it produces points at the Prisma call, not at here.
export type SubScore = {
  label: string;
  score: number;
};

export interface Verdict {
  score: number;
  /**
   * Never null on a rendered verdict — `readVerdict` withholds the whole thing
   * without it, so consumers don't need a "score but no words" layout.
   */
  summary: string;
  subScores: SubScore[];
}

/** Clamps to 0–10 and rounds to one decimal; returns null for anything unusable. */
export function normalizeScore(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.round(Math.min(VERDICT_MAX, Math.max(0, n)) * 10) / 10;
}

/**
 * Reads the `verdictSubScores` JSON column defensively. It's a free-form Json
 * field, so anything could be in there — including rows written before this
 * shape existed.
 */
export function parseSubScores(raw: unknown): SubScore[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const { label, score } = entry as { label?: unknown; score?: unknown };
      const cleanLabel = typeof label === "string" ? label.trim() : "";
      const cleanScore = normalizeScore(score);
      if (!cleanLabel || cleanScore === null) return null;
      return { label: cleanLabel, score: cleanScore };
    })
    .filter((s): s is SubScore => s !== null)
    .slice(0, 8); // more than this stops being scannable, which is the point of it
}

/**
 * Builds the display verdict for a post, or null when there isn't one.
 *
 * Requires **both** a written bottom line and a score. Numbers on their own
 * aren't a verdict — an editor who typed 8.4 and moved on hasn't said anything,
 * and a card that showed the bar chart alone would look like a finished opinion
 * that nobody actually wrote. So a bare score renders nothing, and the Review
 * structured data (which needs a `reviewBody`) stays off with it.
 *
 * The score itself may be implicit: a post with sub-scores but no overall gets
 * their mean, which is what an editor filling in only the category rows expects.
 */
export function readVerdict(post: {
  verdictScore: number | null;
  verdictSummary: string | null;
  verdictSubScores: unknown;
}): Verdict | null {
  const summary = post.verdictSummary?.trim();
  if (!summary) return null;

  const subScores = parseSubScores(post.verdictSubScores);
  const explicit = normalizeScore(post.verdictScore);

  const score =
    explicit ??
    (subScores.length
      ? normalizeScore(subScores.reduce((sum, s) => sum + s.score, 0) / subScores.length)
      : null);

  if (score === null) return null;

  return { score, summary, subScores };
}

/** Short editorial band for a score, used as the badge label on the card. */
export function verdictBand(score: number): string {
  if (score >= 9) return "Outstanding";
  if (score >= 8) return "Great";
  if (score >= 7) return "Good";
  if (score >= 5.5) return "Decent";
  if (score >= 4) return "Flawed";
  return "Avoid";
}

/**
 * Coerces the dashboard form's payload into columns.
 *
 * Returns an empty object when `verdictScore` is absent from the request so a
 * PATCH that only touches the body can't wipe an existing verdict; an explicit
 * `null` is how the editor clears one.
 */
export function verdictFieldsFromBody(body: Record<string, unknown>) {
  if (!("verdictScore" in body) && !("verdictSummary" in body) && !("verdictSubScores" in body)) {
    return {};
  }

  const score = normalizeScore(body.verdictScore);
  // Clearing the score clears the whole verdict — a summary and sub-scores
  // with no headline number render as a card with a blank where the score goes.
  if (score === null) {
    return { verdictScore: null, verdictSummary: null, verdictSubScores: [] };
  }

  const summary =
    typeof body.verdictSummary === "string" && body.verdictSummary.trim()
      ? body.verdictSummary.trim()
      : null;

  return {
    verdictScore: score,
    verdictSummary: summary,
    verdictSubScores: parseSubScores(body.verdictSubScores),
  };
}
