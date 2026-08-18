import { Award } from "lucide-react";
import { VERDICT_MAX, verdictBand, type Verdict } from "@/lib/verdict";

/**
 * The editorial verdict block — score, sub-scores and the bottom line.
 *
 * Placed at the end of the article body rather than the top: it's the payoff,
 * and a reader who scrolls straight to it still gets the whole answer in one
 * card. Deliberately a Server Component — the bars are plain CSS widths, so
 * this costs no client JS on a page that already ships plenty.
 */
export default function VerdictCard({
  verdict,
  productName,
}: {
  verdict: Verdict;
  productName: string;
}) {
  const { score, summary, subScores } = verdict;
  const pct = (score / VERDICT_MAX) * 100;

  return (
    <section
      aria-labelledby="verdict-heading"
      // overflow-hidden matters in the modern theme: the section picks up the
      // theme radius from `border-4`, but the header strip below is a child
      // with its own background and square corners, which would otherwise
      // poke out through the rounded top edge.
      className="my-10 overflow-hidden border-4 border-border-heavy bg-card shadow-brutal-lg"
    >
      <div className="flex items-center gap-2 border-b-4 border-border-heavy bg-accent px-4 py-3 text-on-accent">
        <Award className="h-4 w-4 shrink-0" strokeWidth={2.5} />
        <h2
          id="verdict-heading"
          className="text-[11px] font-extrabold uppercase tracking-[0.16em]"
        >
          Our verdict
        </h2>
      </div>

      <div className="flex flex-col gap-6 p-5 sm:flex-row sm:p-6">
        {/* Score block */}
        <div className="flex shrink-0 flex-col items-center justify-center gap-1 border-2 border-border-heavy bg-accent-2 px-5 py-4 text-on-accent-2 sm:w-40">
          <p className="flex items-baseline gap-0.5 font-black leading-none tabular-nums">
            <span className="text-5xl">{score.toFixed(1)}</span>
            <span className="text-lg opacity-70">/{VERDICT_MAX}</span>
          </p>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em]">
            {verdictBand(score)}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          {/* Always present — readVerdict withholds the whole card without it. */}
          <p className="text-[15px] font-medium leading-relaxed text-foreground">{summary}</p>

          {subScores.length > 0 && (
            <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {subScores.map((s) => (
                <div key={s.label}>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="truncate text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">
                      {s.label}
                    </dt>
                    <dd className="shrink-0 text-xs font-black tabular-nums text-foreground">
                      {s.score.toFixed(1)}
                    </dd>
                  </div>
                  <div
                    className="mt-1 h-2.5 border-2 border-border-heavy bg-background"
                    role="img"
                    aria-label={`${s.label}: ${s.score} out of ${VERDICT_MAX}`}
                  >
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${(s.score / VERDICT_MAX) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </dl>
          )}

          {/* Overall bar, so the headline number is readable at a glance even
              when no sub-scores were filled in. */}
          <div className="mt-5 border-t-2 border-border pt-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[10px] font-extrabold uppercase tracking-wide text-foreground">
                {productName} overall
              </span>
              <span className="shrink-0 text-xs font-black tabular-nums text-foreground">
                {score.toFixed(1)}
              </span>
            </div>
            <div className="mt-1 h-3 border-2 border-border-heavy bg-background">
              <div className="h-full bg-accent-3" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
