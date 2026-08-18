import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Skeleton from "@/components/ui/Skeleton";

/** Mirrors bookmarks/page.tsx: a max-w-5xl column, heading row, then a card grid. */
export default function BookmarksLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div
        className="flex-1 mx-auto w-full max-w-5xl px-6 py-10"
        role="status"
        aria-busy="true"
        aria-label="Loading bookmarks"
      >
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-56" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="surface-border bg-card">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
                <div className="mt-4 flex items-center gap-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
