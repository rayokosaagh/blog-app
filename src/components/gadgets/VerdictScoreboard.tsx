import { prisma } from "@/lib/prisma";
import { readVerdict } from "@/lib/verdict";
import { Award } from "lucide-react";
import { FadeIn } from "@/components/ui/AnimatedSection";
import SectionHeader from "@/components/ui/SectionHeader";
import VerdictScoreboardList, { type ScoredProduct } from "./VerdictScoreboardList";

/** How many cards the homepage row shows at most. */
export const SCOREBOARD_SIZE = 5;

/**
 * Homepage "Editor's verdicts" — the products the publication has actually
 * scored, newest verdict first, each with its headline number and bottom
 * line.
 *
 * Exists for the first-time visitor: every other section on the page is a
 * list of things (posts, products, comparisons), and none of them says in one
 * glance "this site has opinions and here they are". A row of big scores does.
 *
 * Only *editorial* verdicts appear here — the same `readVerdict` gate as the
 * article page, so a product with a number but no written bottom line is
 * withheld, and nothing is ever derived from spec data (see AGENTS.md: spec
 * values are free text; opinions computed from them are guesses in the
 * publication's voice). Renders nothing until at least one product is scored,
 * so a catalogue with no verdicts sees the homepage unchanged.
 */
export async function getScoredProducts(limit = SCOREBOARD_SIZE): Promise<ScoredProduct[]> {
  // Over-fetch a little: `verdictSummary` is the only column Prisma can
  // filter on cheaply, and readVerdict may still drop a row whose score is
  // missing on both the overall and every sub-score.
  const rows = await prisma.product.findMany({
    where: { published: true, verdictSummary: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: limit * 2,
    select: {
      id: true,
      slug: true,
      name: true,
      brand: true,
      image: true,
      verdictScore: true,
      verdictSummary: true,
      verdictSubScores: true,
      category: { select: { name: true } },
    },
  });

  const scored: ScoredProduct[] = [];
  for (const row of rows) {
    const verdict = readVerdict(row);
    if (!verdict) continue;
    scored.push({
      id: row.id,
      slug: row.slug,
      name: row.name,
      brand: row.brand,
      image: row.image,
      categoryName: row.category.name,
      verdict,
    });
    if (scored.length >= limit) break;
  }
  return scored;
}

export default function VerdictScoreboard({ products }: { products: ScoredProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="max-w-[1600px] mx-auto px-6 w-full" aria-labelledby="verdicts-heading">
      <FadeIn>
        <SectionHeader
          id="verdicts-heading"
          Icon={Award}
          eyebrow="Scored & reviewed"
          title="Editor's Verdicts"
          subtitle="Gadgets we've scored, and the bottom line on each"
          action={{ href: "/products", label: "All gadgets" }}
          accent="accent-3"
        />
      </FadeIn>

      <VerdictScoreboardList products={products} />
    </section>
  );
}
