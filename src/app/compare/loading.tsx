import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Skeleton from "@/components/ui/Skeleton";

/**
 * /compare fallback. The page is a single max-w-6xl card holding the heading,
 * the category tab strip and the product slot row.
 */
export default function CompareLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="relative min-h-screen bg-background" role="status" aria-busy="true" aria-label="Loading comparison">
        <div className="relative mx-auto max-w-6xl px-4 py-10">
          <div className="surface-border bg-card shadow-brutal p-4 sm:p-8">
            <div className="mb-6">
              <Skeleton className="h-9 w-72 max-w-full" />
              <Skeleton className="mt-3 h-4 w-96 max-w-full" />
            </div>

            {/* Category tabs */}
            <Skeleton className="h-12 w-full max-w-lg" />

            {/* Product slots */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-44 w-full" />
              <Skeleton className="hidden h-44 w-16 lg:block" />
            </div>

            <Skeleton className="mx-auto mt-10 h-5 w-64" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
