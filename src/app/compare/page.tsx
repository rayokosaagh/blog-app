// src/app/compare/page.tsx
import GadgetCompare from "@/components/gadgets/GadgetCompare";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const MAX_COMPARE_SLOTS = 8;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;

  const slugs: string[] = [];
  for (let i = 1; i <= MAX_COMPARE_SLOTS; i++) {
    const val = params[`p${i}`];
    if (typeof val === "string" && val) slugs.push(val);
  }

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen bg-background">
        <div className="relative max-w-6xl mx-auto px-4 py-10">
          <GadgetCompare defaultCategory={category} defaultSlugs={slugs} />
        </div>
      </main>

      {/* Sibling of <main>, not a child of the max-w-6xl wrapper — the footer
          spans the full page width here exactly as it does on every other
          page. Rendering it inside GadgetCompareClient boxed it to the
          comparison table's column. */}
      <Footer />
    </>
  );
}