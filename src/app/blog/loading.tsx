import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Skeleton from "@/components/ui/Skeleton";

/**
 * /blog listing fallback. Mirrors blog/page.tsx: a max-w-6xl header with the
 * breadcrumb pill and headline, then the feed — a 1.3fr/1fr feature pair, a
 * three-up row, a stacked list, and the pagination nav.
 */
export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-background" role="status" aria-busy="true" aria-label="Loading articles">
      <Navbar />

      <header className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        {/* Breadcrumb pill */}
        <Skeleton className="h-9 w-40 mb-8" />
        <Skeleton className="h-12 w-80 max-w-full mb-4" />
        <Skeleton className="h-5 w-full max-w-xl" />
        {/* Filter / sort row */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-36" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-6">
            {/* Feature pair — grid-cols-[1.3fr_1fr] at md */}
            <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6 items-stretch">
              <Skeleton className="h-[380px] md:h-[600px] w-full" />
              <Skeleton className="h-[380px] md:h-[600px] w-full" />
            </div>

            {/* Three-up row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[350px] w-full" />
              ))}
            </div>
          </div>

          {/* Stacked list */}
          <div className="flex flex-col gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[190px] w-full" />
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-12 flex items-center justify-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-9" />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
