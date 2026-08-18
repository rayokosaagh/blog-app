import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Skeleton from "@/components/ui/Skeleton";

/** Mirrors account/page.tsx: a max-w-3xl column of stacked settings cards. */
export default function AccountLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div
        className="flex-1 mx-auto w-full max-w-3xl px-6 py-10"
        role="status"
        aria-busy="true"
        aria-label="Loading account"
      >
        {/* Profile card */}
        <div className="surface-border bg-card shadow-brutal px-6 py-8 md:px-8">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-6 h-24 w-24" />
          <div className="mt-6 space-y-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
          <Skeleton className="mt-6 h-10 w-32" />
        </div>

        {/* Secondary cards */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="surface-border bg-card shadow-brutal mt-6 px-6 py-8 md:px-8">
            <Skeleton className="h-6 w-48" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((__, j) => (
                <Skeleton key={j} className="h-12 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
}
