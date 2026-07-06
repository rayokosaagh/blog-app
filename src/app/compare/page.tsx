// src/app/compare/page.tsx
import GadgetCompare from "@/components/GadgetCompare";
import Navbar from "@/components/Navbar";

export default function ComparePage({
  searchParams,
}: {
  searchParams: { category?: string; p1?: string; p2?: string };
}) {
  return (
    <>
      {/* Site nav — was completely missing from this page before */}
      <Navbar />

      {/* Page background: soft gradient + two blurred color blobs, matching
          the blue/purple accent colors used in Navbar's glass UI */}
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white to-zinc-50 dark:from-[#0a1322] dark:to-[#0c1a2e]">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-3xl" />
          <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-purple-400/20 dark:bg-purple-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-10">
          <GadgetCompare
            defaultCategory={searchParams.category}
            defaultSlugs={[searchParams.p1, searchParams.p2].filter(Boolean) as string[]}
          />
        </div>
      </main>
    </>
  );
}