import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Skeleton from "@/components/ui/Skeleton";

/**
 * Article loading fallback.
 *
 * Without this file the route fell back to the nearest boundary — app/loading.tsx,
 * the HOMEPAGE skeleton — so opening a post flashed a hero carousel, a top-story
 * grid and a three-column feed before the article arrived. Nothing about that
 * shape matches an article page.
 *
 * Mirrors blog/[slug]/page.tsx: a fixed-height hero banner, then `main` with the
 * two absolutely-positioned gutter rails around a centred 896px column. Keep the
 * hero height, the rail breakpoint and `.article-rail` in sync with that file.
 */

/** For placeholders sitting ON the hero, which is itself a bg-border block. */
function HeroSkeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-card/70 ${className}`} aria-hidden="true" />;
}

export default function ArticleLoading() {
  return (
    <div className="relative min-h-screen bg-background">
      <Navbar />

      <main role="status" aria-busy="true" aria-label="Loading article">
        {/* Hero banner — same h-[420px] md:h-[500px] as the real one, so the
            article card below starts at the same y and nothing jumps. */}
        <div className="relative h-[420px] w-full overflow-hidden bg-border md:h-[500px]">
          {/* Breadcrumb pill */}
          <div className="absolute top-6 left-0 right-0 z-20 mx-auto max-w-4xl px-6">
            <HeroSkeleton className="h-10 w-80 max-w-full" />
          </div>

          {/* Tags, headline, byline */}
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-4xl px-6 pb-10">
            <div className="mb-5 flex flex-wrap gap-2">
              <HeroSkeleton className="h-7 w-24" />
              <HeroSkeleton className="h-7 w-28" />
              <HeroSkeleton className="h-7 w-20" />
            </div>

            <div className="mb-5 space-y-3">
              <HeroSkeleton className="h-9 w-full md:h-12" />
              <HeroSkeleton className="h-9 w-3/4 md:h-12" />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <HeroSkeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <HeroSkeleton className="h-4 w-28" />
                  <HeroSkeleton className="h-3 w-40" />
                </div>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <HeroSkeleton key={i} className="h-5 w-5" />
                ))}
                <HeroSkeleton className="h-11 w-11 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-8 w-full max-w-[1720px] px-6 pb-8 md:pb-12">
          <style>{`
            /* Must match blog/[slug]/page.tsx exactly, or the rails land in
               different places before and after the content arrives. */
            .article-rail {
              width: min(340px, calc((min(100vw, 1720px) - 944px) / 2 - 32px));
            }
          `}</style>

          {/* ToC rail */}
          <div className="article-rail absolute inset-y-0 left-6 z-20 hidden min-[1440px]:block">
            <div className="sticky top-28">
              <div className="bg-card surface-border shadow-brutal px-5 py-6">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="mt-2 h-3 w-full" />
                <div className="mt-4 mb-4 border-t-2 border-border" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="mt-3 h-2 w-full" />
                <div className="mt-5 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className={`h-4 ${i % 2 ? "w-3/4" : "w-full"}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Article card — mx-auto is what centres it on the viewport, matching
              the hero above and the rating/comments blocks below. */}
          <div className="mx-auto w-full max-w-4xl">
            <div className="bg-card border-[1.5px] border-border-heavy px-8 pt-12 pb-8 md:px-10">
              <Skeleton className="h-10 w-2/3" />

              <div className="mt-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className={`h-4 ${i === 3 ? "w-4/5" : "w-full"}`} />
                ))}
              </div>

              {/* Lead image / gallery block */}
              <Skeleton className="mt-8 aspect-video w-full" />

              <div className="mt-8 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className={`h-4 ${i === 4 ? "w-2/3" : "w-full"}`} />
                ))}
              </div>

              <Skeleton className="mt-10 h-7 w-1/2" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className={`h-4 ${i === 3 ? "w-3/4" : "w-full"}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Socials + spotlight ad rail */}
          <div className="article-rail absolute inset-y-0 right-6 z-20 hidden min-[1440px]:block">
            <div className="sticky top-28">
              <div className="bg-card surface-border shadow-brutal px-4 py-5 min-[1700px]:px-8 min-[1700px]:py-8">
                <Skeleton className="h-6 w-24" />
                <div className="mt-4 mb-4 border-t-2 border-border" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              </div>
              <div className="mt-8 h-[420px]">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
