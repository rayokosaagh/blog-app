import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Skeleton from "@/components/ui/Skeleton";

/**
 * Homepage loading fallback.
 *
 * This mirrors the real structure of app/page.tsx section for section — hero
 * spotlight, top-story tiles, then the three-column latest-posts grid — because
 * a skeleton that doesn't match the layout it precedes causes the exact content
 * jump it exists to prevent. Keep the two in sync: the section wrappers, gaps
 * and grid tracks below are copied verbatim from page.tsx.
 *
 * Two deliberate approximations:
 *  - The three-column form (socials | feed | poll) is hardcoded. page.tsx picks
 *    between that and a two-column no-poll layout based on a DB count, which a
 *    loading file cannot do without becoming async and defeating its purpose.
 *  - Seven feed tiles, matching page.tsx's `.slice(0, 7)`.
 */

// SocialSidebar's card. Rendered twice, exactly as page.tsx does: once in the
// desktop-only left rail, once under the poll on mobile.
function SocialsCardSkeleton() {
  return (
    <div className="bg-card surface-border shadow-brutal px-4 py-6 sm:px-6 sm:py-8 md:px-8">
      <Skeleton className="h-6 w-28" />
      <div className="mt-4 mb-4 border-t-2 border-border" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}

// Same repeating mosaic pattern as LatestPostsFeed's TILE_SPANS, written out as
// literal classes so the build's content scanner sees them.
const TILE_SPANS = [
  "md:col-span-2 md:row-span-2",
  "md:col-span-2 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-2 md:row-span-1",
];

export default function HomeLoading() {
  return (
    <div className="relative min-h-screen">
      <Navbar />

      <main
        role="status"
        aria-busy="true"
        aria-label="Loading the homepage"
        className="flex flex-col gap-10 sm:gap-14 lg:gap-16 pt-4 sm:pt-6 lg:pt-8 pb-10 sm:pb-14 lg:pb-16"
      >
        {/* ---- Hero banner + ad rail, top stories mosaic, value props ---- */}
        <section className="max-w-[1600px] mx-auto px-6 w-full">
          {/* HeroBanner (min-h 26rem / 30rem at lg) beside the 20rem AdCarousel
              rail — same grid as page.tsx so nothing shifts when content lands. */}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-stretch">
            <Skeleton className="min-h-[26rem] w-full surface-border lg:min-h-[30rem]" />
            <Skeleton className="min-h-[18rem] w-full surface-border lg:min-h-0" />
          </div>

          {/* "Top stories" section header — icon chip + title/subtitle, all-stories pill */}
          <div className="mt-8 mb-4 flex items-end justify-between gap-4 sm:mt-10 sm:mb-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
            <Skeleton className="hidden h-8 w-28 sm:block" />
          </div>

          {/* TopStoriesMosaic: lead spans two rows at ~46%, a pair beside it, one wide below */}
          <div className="grid gap-4 lg:grid-cols-[46fr_54fr] lg:grid-rows-2">
            <Skeleton className="min-h-[18rem] surface-border sm:min-h-[22rem] lg:row-span-2 lg:min-h-0" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="min-h-[11rem] surface-border" />
              <Skeleton className="min-h-[11rem] surface-border" />
            </div>
            <Skeleton className="min-h-[9rem] surface-border" />
          </div>

          {/* ValueProps band */}
          <Skeleton className="mt-6 h-20 w-full surface-border" />
        </section>

        {/* ---- Latest posts: socials | feed | poll ---- */}
        <section className="max-w-[1600px] mx-auto px-6 w-full">
          <div className="flex flex-col gap-10 lg:grid lg:gap-12 lg:items-stretch lg:grid-cols-[18rem_minmax(0,1fr)_20rem]">
            {/* Socials rail (desktop only, same as page.tsx) */}
            <div className="hidden h-full pt-4 lg:block lg:pt-0">
              <div className="sticky top-24 self-start">
                <SocialsCardSkeleton />
              </div>
            </div>

            {/* Feed */}
            <div className="mx-auto w-full lg:max-w-[900px]">
              <div className="mb-10 border-b-4 border-border-heavy pb-4 text-center lg:text-left">
                <div className="mb-3 flex justify-center lg:justify-start">
                  <Skeleton className="h-7 w-36" />
                </div>
                {/* h-10 = the h3's text-4xl line box; h-6 = the subtitle's
                    text-base line box. Undersizing these is what left the feed
                    grid sitting 7px high of where the real one lands. */}
                <Skeleton className="mx-auto mb-2 h-10 w-64 lg:mx-0" />
                <Skeleton className="mx-auto h-6 w-52 lg:mx-0" />
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 md:auto-rows-[160px] lg:auto-rows-[180px] md:grid-flow-dense">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`${
                      i === 0 ? "col-span-2 aspect-[4/3]" : "col-span-1 aspect-square"
                    } md:aspect-auto ${TILE_SPANS[i % TILE_SPANS.length]}`}
                  >
                    <Skeleton className="h-full w-full" />
                  </div>
                ))}
              </div>

              <div className="mt-12 flex justify-center lg:justify-start">
                <Skeleton className="h-12 w-44" />
              </div>
            </div>

            {/* Poll rail — and, below lg, the socials card, which page.tsx
                stacks here because the left rail is hidden on mobile. */}
            <div className="h-full pt-4 lg:pt-0">
              <div className="lg:sticky lg:top-24 lg:self-start">
                <div className="flex flex-col gap-6 lg:block">
                  {/* Measured against the live card (586px): 28px header,
                      36px prev/next row, 54px option rows, total-votes line. */}
                  <div className="bg-card surface-border shadow-brutal px-4 py-6 sm:px-6 sm:py-8 md:px-8">
                    <Skeleton className="h-7 w-24" />
                    <div className="mt-4 mb-4 border-t-2 border-border" />
                    <div className="mb-4 flex justify-end gap-2">
                      <Skeleton className="h-9 w-9" />
                      <Skeleton className="h-9 w-9" />
                    </div>
                    <Skeleton className="mb-4 h-12 w-11/12" />
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-[54px] w-full" />
                      ))}
                    </div>
                    <Skeleton className="mx-auto mt-6 h-4 w-24" />
                  </div>

                  <div className="lg:hidden">
                    <SocialsCardSkeleton />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
