import Skeleton from "@/components/ui/Skeleton";

/**
 * Covers the whole /dashboard subtree — all 18 routes under it — because a
 * `loading.tsx` applies to its segment and every child segment that does not
 * declare its own.
 *
 * Deliberately renders only page content, no chrome: dashboard/layout.tsx wraps
 * children in <DashboardShell>, whose sidebar and <main> stay mounted across
 * these navigations. Repeating them here would double the shell.
 *
 * Generic on purpose. The dashboard pages are a stat row, a chart panel and a
 * table in varying combinations, so one shape covers them without pretending to
 * predict which. Add a route-local loading.tsx if a specific page diverges.
 */
export default function DashboardLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-3 h-3 w-28" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-5 h-64 w-full" />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <Skeleton className="h-5 w-32" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="mt-2 h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 p-5 dark:border-zinc-800">
          <Skeleton className="h-5 w-36" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-zinc-100 p-4 last:border-0 dark:border-zinc-800/60"
          >
            <Skeleton className="h-10 w-10 shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-28 sm:block" />
            <Skeleton className="hidden h-4 w-20 md:block" />
            <Skeleton className="h-8 w-8 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
