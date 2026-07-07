// src/app/compare/page.tsx
import GadgetCompare from "@/components/GadgetCompare";
import Navbar from "@/components/Navbar";

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
      <main className="relative min-h-screen bg-white">
        <div className="relative max-w-6xl mx-auto px-4 py-10">
          <GadgetCompare defaultCategory={category} defaultSlugs={slugs} />
        </div>
      </main>
    </>
  );
}