import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Skeleton from "@/components/ui/Skeleton";

/**
 * Product detail fallback. Mirrors product/[slug]/page.tsx: a max-w-[1400px]
 * column holding the hero card (title bar + gallery/summary body), the
 * three-cell stat strip, then the sticky w-56 spec nav beside the spec sections.
 */
export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main
        className="max-w-[1400px] mx-auto px-6 pt-10 sm:pt-14 pb-16"
        role="status"
        aria-busy="true"
        aria-label="Loading product"
      >
        {/* Hero card */}
        <div className="border-2 border-border-heavy bg-card shadow-brutal-lg">
          <div className="flex items-center justify-between gap-4 border-b-4 border-border-heavy p-6">
            <Skeleton className="h-8 w-72 max-w-full" />
            <Skeleton className="hidden h-8 w-28 sm:block" />
          </div>
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2">
            <Skeleton className="aspect-[4/3] w-full" />
            <div>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="mt-4 h-10 w-3/4" />
              <div className="mt-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className={`h-4 ${i === 4 ? "w-2/3" : "w-full"}`} />
                ))}
              </div>
              <Skeleton className="mt-8 h-11 w-40" />
            </div>
          </div>
        </div>

        {/* Three-cell stat strip */}
        <div className="mt-6">
          <div className="grid grid-cols-3 border-2 border-border-heavy divide-x-2 divide-border-heavy">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-3 h-6 w-28" />
              </div>
            ))}
          </div>
        </div>

        {/* Spec nav + spec sections */}
        <div className="mt-10 flex flex-col gap-8 lg:flex-row">
          <nav className="hidden w-56 shrink-0 self-start lg:sticky lg:top-24 lg:block">
            <div className="surface-border bg-card p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="mb-3 h-4 w-full last:mb-0" />
              ))}
            </div>
          </nav>

          <div className="flex min-w-0 flex-1 flex-col gap-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="surface-border bg-card p-6">
                <Skeleton className="h-6 w-40" />
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <div key={j} className="flex gap-6">
                      <Skeleton className="h-4 w-32 shrink-0" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
