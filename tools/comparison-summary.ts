/**
 * Inspects — and optionally sets — the editor summary on a curated comparison.
 *
 *   npx tsx tools/comparison-summary.ts                 # list curated pairs
 *   npx tsx tools/comparison-summary.ts <id> "A copy" "B copy"
 *   npx tsx tools/comparison-summary.ts <id> --clear
 *
 * The dashboard (/dashboard/gadgets/comparisons → "Add summary") is the real
 * way to write these; this is for checking what's stored.
 */
import "dotenv/config";
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL! })),
});

async function main() {
  const [id, a, b] = process.argv.slice(2);

  if (!id) {
    const rows = await prisma.comparison.findMany({
      include: { productA: { select: { slug: true } }, productB: { select: { slug: true } } },
      orderBy: { order: "asc" },
    });
    for (const c of rows) {
      console.log(
        `${c.id}  ${c.productA.slug} vs ${c.productB.slug}  ` +
          `A:${c.verdictA ? "set" : "—"} B:${c.verdictB ? "set" : "—"}`
      );
    }
    return;
  }

  const clear = a === "--clear";
  const updated = await prisma.comparison.update({
    where: { id },
    data: clear
      ? { verdictA: null, verdictB: null }
      : { verdictA: a?.trim() || null, verdictB: b?.trim() || null },
    include: { productA: { select: { slug: true } }, productB: { select: { slug: true } } },
  });

  console.log(
    `${updated.productA.slug} vs ${updated.productB.slug} → ` +
      `A:${updated.verdictA ?? "—"} | B:${updated.verdictB ?? "—"}`
  );
}

main().finally(() => prisma.$disconnect());
