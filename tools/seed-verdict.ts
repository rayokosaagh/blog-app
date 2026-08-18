/**
 * Fills in one sample editorial verdict so the feature can be seen without
 * opening the dashboard first.
 *
 *   npx tsx tools/seed-verdict.ts [slug]
 *   npx tsx tools/seed-verdict.ts [slug] --no-summary   # score only
 *   npx tsx tools/seed-verdict.ts [slug] --clear
 *
 * `--no-summary` exists to check the gate in `readVerdict`: scores without a
 * written bottom line must publish nothing at all.
 *
 * Safe to re-run, and safe to delete — clearing the bottom line or the score in
 * /dashboard/posts/<id>/edit removes the card again.
 */
import "dotenv/config";
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL! })),
});

const SUMMARY =
  "The most complete midrange phone on sale in Nepal right now. The bloatware " +
  "is annoying and the ultrawide is weak, but neither undoes an unusually " +
  "well-balanced package.";

const SUB_SCORES = [
  { label: "Battery", score: 9.5 },
  { label: "Performance", score: 8.5 },
  { label: "Display", score: 8.5 },
  { label: "Camera", score: 7.0 },
  { label: "Software", score: 6.5 },
  { label: "Value", score: 9.0 },
];

async function main() {
  const args = process.argv.slice(2);
  const slug =
    args.find((a) => !a.startsWith("--")) ??
    "xiaomi-redmi-note-17-pro-review-the-midrange-phone-to-beat";

  const clear = args.includes("--clear");
  const noSummary = args.includes("--no-summary");

  const post = await prisma.post.update({
    where: { slug },
    data: clear
      ? { verdictScore: null, verdictSummary: null, verdictSubScores: [] }
      : {
          verdictScore: 8.4,
          verdictSummary: noSummary ? null : SUMMARY,
          verdictSubScores: SUB_SCORES,
        },
    select: { title: true, verdictScore: true, verdictSummary: true },
  });

  console.log(
    clear
      ? `Cleared the verdict on "${post.title}"`
      : `Set ${post.verdictScore}/10 on "${post.title}" (summary: ${
          post.verdictSummary ? "yes" : "none — card should stay hidden"
        })`
  );
}

main().finally(() => prisma.$disconnect());
