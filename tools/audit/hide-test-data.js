/**
 * Hides placeholder/test content from the live site.
 *
 *   node tools/audit/hide-test-data.js --dry   # preview, writes nothing
 *   node tools/audit/hide-test-data.js         # apply
 *
 * NOTHING IS DELETED — this only flips boolean columns, so it is fully
 * reversible (see UNDO printed at the end). Votes, comments and relations are
 * left untouched, which is why this is preferred over deleting rows.
 *
 * Edit the two lists below to target whatever placeholder content exists.
 */
require("dotenv").config({ quiet: true });
const { Client } = require("pg");

const DRY = process.argv.includes("--dry");

/** Product slugs to unpublish. */
const JUNK_PRODUCT_SLUGS = ["fsadfas"];
/** Poll questions to deactivate. */
const JUNK_POLL_QUESTIONS = ["123123", "12331232"];

(async () => {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    statement_timeout: 20000,
  });
  await c.connect();

  try {
    // Note the table names: Product is @@map'd to "products" (lowercase), while
    // Poll is not mapped and keeps its quoted PascalCase name.
    const products = await c.query(
      `SELECT slug, name, published FROM products WHERE slug = ANY($1)`,
      [JUNK_PRODUCT_SLUGS]
    );
    const polls = await c.query(
      `SELECT id, question, "isActive" FROM "Poll" WHERE question = ANY($1)`,
      [JUNK_POLL_QUESTIONS]
    );

    console.log("Products to hide:");
    console.table(products.rows);
    console.log("Polls to deactivate:");
    console.table(polls.rows);

    if (DRY) {
      console.log("\n--dry given: nothing written.");
      return;
    }
    if (!products.rowCount && !polls.rowCount) {
      console.log("\nNothing matched — already clean.");
      return;
    }

    const p = await c.query(
      `UPDATE products SET published = false WHERE slug = ANY($1) RETURNING slug, published`,
      [JUNK_PRODUCT_SLUGS]
    );
    const q = await c.query(
      `UPDATE "Poll" SET "isActive" = false WHERE question = ANY($1) RETURNING question, "isActive"`,
      [JUNK_POLL_QUESTIONS]
    );

    console.log("\nDone.");
    console.table(p.rows);
    console.table(q.rows);
    console.log(
      "\nUNDO:\n" +
        `  UPDATE products SET published = true WHERE slug IN ('${JUNK_PRODUCT_SLUGS.join("','")}');\n` +
        `  UPDATE "Poll" SET "isActive" = true WHERE question IN ('${JUNK_POLL_QUESTIONS.join("','")}');`
    );
  } finally {
    await c.end();
  }
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
