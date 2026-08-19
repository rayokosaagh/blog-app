"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { History, X } from "lucide-react";
import { historyStore, resumable, clearHistory } from "@/lib/readingHistory";

/**
 * "Pick up where you left off" rail.
 *
 * Reads from localStorage, so it renders nothing on the server and nothing on
 * a first visit — mounted unconditionally by the pages that want it and it
 * simply stays out of the way until there's something to resume. Falls back to
 * recently-read articles when nothing is mid-read, which keeps the rail useful
 * for someone who finishes everything they open.
 */
export default function ContinueReading({
  limit = 4,
  className = "",
  excludeSlug,
}: {
  limit?: number;
  className?: string;
  /**
   * Drop one article from the rail — the one the reader is currently on.
   * Without it an article page ends with a rail inviting you to continue
   * the piece you just finished, marked "Finished". Optional, so the
   * homepage is unaffected.
   */
  excludeSlug?: string;
}) {
  const all = useSyncExternalStore(
    historyStore.subscribe,
    historyStore.getSnapshot,
    historyStore.getServerSnapshot
  );

  const entries = useMemo(() => {
    const pool = excludeSlug ? all.filter((e) => e.slug !== excludeSlug) : all;
    // Prefer articles still in progress; fall back to recently read so the
    // rail stays useful for someone who finishes everything they open.
    const unfinished = resumable(pool);
    return (unfinished.length > 0 ? unfinished : pool).slice(0, limit);
  }, [all, limit, excludeSlug]);

  // Empty on the server and on a first visit — the rail simply isn't there.
  if (entries.length === 0) return null;

  const resuming = entries.some((e) => e.progress > 0 && e.progress < 0.9);

  return (
    // max-w-[1600px], not max-w-6xl: every other band on the homepage — its
    // only consumer — is capped at 1600px, so at 1152px this rail visibly
    // stepped in from the sections above and below it.
    <section className={`mx-auto w-full max-w-[1600px] px-6 ${className}`}>
      <div className="mb-4 flex items-end justify-between gap-4 border-b-2 border-border-heavy pb-2">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
            {resuming ? "Pick up where you left off" : "Recently read"}
          </p>
          <h2 className="mt-0.5 flex items-center gap-2 text-2xl font-black tracking-tight text-foreground">
            <History className="h-5 w-5 text-accent" strokeWidth={2.5} />
            Continue reading
          </h2>
        </div>

        <button
          type="button"
          onClick={clearHistory}
          className="flex shrink-0 items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {entries.map((e) => (
          <li key={e.slug}>
            <Link
              href={`/blog/${e.slug}`}
              className="brutal-press group flex h-full flex-col overflow-hidden border-2 border-border-heavy bg-card shadow-brutal-sm"
            >
              <div className="relative aspect-[16/9] overflow-hidden border-b-2 border-border-heavy bg-muted">
                {e.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : null}
                {e.tag && (
                  <span className="absolute left-2 top-2 border-2 border-border-heavy bg-accent-3 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-on-accent-3">
                    {e.tag}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-3">
                <h3 className="line-clamp-3 text-sm font-extrabold leading-snug text-foreground">
                  {e.title}
                </h3>

                <div className="mt-auto pt-3">
                  <div className="h-2 border-2 border-border-heavy bg-background">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${Math.round(e.progress * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {e.progress >= 0.9
                      ? "Finished"
                      : `${Math.round(e.progress * 100)}% read`}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
