import Skeleton from "@/components/ui/Skeleton";

/**
 * Shared fallback for the two catalogue routes — /products and /tag/[slug].
 * Both render <PageHeader> above <ProductListing>, so both get the same shape:
 * a max-w-[1600px] header, a results bar, then the sticky lg:w-72 filter rail
 * beside ProductGrid's 1/2/3/4-column card grid.
 */
export default function CatalogueSkeleton({ cards = 12 }: { cards?: number }) {
  return (
    <>
      {/* PageHeader */}
      <header className="relative mx-auto max-w-[1600px] px-6 pt-14 pb-8">
        <Skeleton className="mb-8 h-9 w-44" />
        <Skeleton className="h-12 w-96 max-w-full" />
        <Skeleton className="mt-3 h-5 w-40" />
        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        {/* Quick-pick chips. Literal classes, not `w-${n}` — Tailwind's content
            scanner only sees class names that appear whole in the source. */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-36" />
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 pb-24">
        {/* Category tab strip */}
        <div className="mb-6">
          <Skeleton className="h-12 w-full max-w-2xl" />
        </div>

        <div className="flex flex-col items-start gap-8 lg:flex-row">
          {/* Filter rail — same sticky lg:w-72 as ProductListing */}
          <aside className="sticky top-20 z-20 w-full shrink-0 self-start lg:top-24 lg:w-72">
            <div className="surface-border bg-card p-4">
              <Skeleton className="h-6 w-28" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
          </aside>

          {/* ProductGrid */}
          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: cards }).map((_, i) => (
                <div key={i} className="surface-border bg-card">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="p-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="mt-2 h-3 w-1/2" />
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
