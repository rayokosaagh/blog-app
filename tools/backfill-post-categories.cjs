/**
 * One-off: guess a category for every post that still has the default (NEWS)
 * from its title, print the plan, and — with --apply — write it.
 *
 *   node tools/backfill-post-categories.cjs          # dry run, prints table
 *   node tools/backfill-post-categories.cjs --apply  # writes the guesses
 *
 * Title heuristics only, in this order (first match wins):
 *   REVIEW  "review", "camera test", "hands-on", "long-term"
 *   VERSUS  " vs ", "versus", "which … should/actually"
 *   DEAL    "price drop/hike/cut", "drops to", "lowest price", "discount", "cashback", "offer", "deal"
 *           (not bare "price" or "sale" — "midrange price" and "goes on sale" are launch news)
 *   GUIDE   "guide", "how to", "explained", "best … to buy", "tips"
 *   NEWS    everything else (already the default, so these rows are skipped)
 *
 * It's a starting point, not a verdict — the dashboard shows the category on
 * every post so anything mis-filed is a two-click fix. Rows already moved off
 * NEWS are never touched, so re-running after manual edits is safe.
 */
require("dotenv/config");
const { PrismaClient } = require("../generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const RULES = [
  ["REVIEW", /\breview\b|camera test|hands[- ]on|long[- ]term/i],
  ["VERSUS", /\bvs\.?\b|\bversus\b|\bwhich\b.*\b(should|actually)\b/i],
  ["DEAL", /price (drop|hike|cut)|drops? to|lowest price|discount|cashback|\boffer\b|\bdeal\b/i],
  ["GUIDE", /\bguide\b|how to|explained|best\b.*\bto buy|\btips\b/i],
];

function guess(title) {
  for (const [key, re] of RULES) if (re.test(title)) return key;
  return "NEWS";
}

(async () => {
  const apply = process.argv.includes("--apply");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const posts = await prisma.post.findMany({
    where: { category: "NEWS" },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  const plan = posts
    .map((p) => ({ ...p, category: guess(p.title) }))
    .filter((p) => p.category !== "NEWS");

  const pad = (s, n) => String(s).padEnd(n).slice(0, n);
  console.log(`${posts.length} posts on NEWS; ${plan.length} would move:\n`);
  for (const p of plan) console.log(`  ${pad(p.category, 7)} ← ${p.title}`);
  const staying = posts.length - plan.length;
  if (staying) console.log(`\n  (${staying} stay NEWS)`);

  if (apply && plan.length) {
    await prisma.$transaction(
      plan.map((p) => prisma.post.update({ where: { id: p.id }, data: { category: p.category } }))
    );
    console.log(`\nApplied ${plan.length} update(s).`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write.");
  }

  await prisma.$disconnect();
  await pool.end();
})();
