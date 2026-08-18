import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Editor-written comparison summary for a pair, keyed by product slug.
 *
 * Only curated Comparison rows carry it, and only pairs — /compare allows any
 * two or three products, so most lookups legitimately come back empty and the
 * UI derives a verdict from the specs instead. Matched in both directions
 * because which product an editor filed as A is arbitrary.
 *
 * Shared by the compare API (for client-side slot changes) and the compare
 * page's server render (for the pair a shared link arrives with).
 */
export async function lookupEditorVerdicts(slugs: string[]): Promise<Record<string, string>> {
  if (slugs.length !== 2) return {};

  const [a, b] = slugs;
  const comparison = await prisma.comparison.findFirst({
    where: {
      OR: [
        { productA: { slug: a }, productB: { slug: b } },
        { productA: { slug: b }, productB: { slug: a } },
      ],
    },
    select: {
      verdictA: true,
      verdictB: true,
      productA: { select: { slug: true } },
      productB: { select: { slug: true } },
    },
  });

  if (!comparison) return {};

  const out: Record<string, string> = {};
  if (comparison.verdictA) out[comparison.productA.slug] = comparison.verdictA;
  if (comparison.verdictB) out[comparison.productB.slug] = comparison.verdictB;
  return out;
}
