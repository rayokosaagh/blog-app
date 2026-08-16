/**
 * Layout diagnostics for the homepage: vertical rhythm between sections and
 * horizontal alignment of the content/sidebar columns.
 *
 *   node tools/audit/layout-audit.js
 *
 * Two classes of bug this catches, both of which have actually shipped here:
 *
 *  - A doubled section gap. SECTION_GAP is applied once as a `gap` on <main>,
 *    but any element that is itself a flex child of <main> (e.g. SectionDivider)
 *    collects that gap on BOTH sides, silently doubling the rhythm.
 *
 *  - A sidebar rail that does not line up with the rails above/below it,
 *    because one section declares a different column width (18rem vs 20rem).
 */
const { loadPlaywright, BASE, settle } = require("./lib/browser");

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

  await page.goto(BASE + "/", { waitUntil: "load", timeout: 90000 });
  await page.waitForTimeout(3000);
  await settle(page);

  const report = await page.evaluate(() => {
    const main = document.querySelector("main");

    const sections = [...main.children].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        top: Math.round(r.top + window.scrollY),
        bottom: Math.round(r.bottom + window.scrollY),
        height: Math.round(r.height),
        label: (el.textContent || "").trim().slice(0, 34) || "(empty)",
      };
    });

    const gaps = [];
    for (let i = 1; i < sections.length; i++) {
      gaps.push({ gap: sections[i].top - sections[i - 1].bottom, after: sections[i - 1].label });
    }

    // Every wide grid and the left/right edges of its columns. Sidebar rails
    // in different sections should share the same left edge.
    const grids = [...document.querySelectorAll("div")]
      .filter((d) => getComputedStyle(d).display === "grid" && d.getBoundingClientRect().width > 900)
      .map((g) => ({
        cols: getComputedStyle(g).gridTemplateColumns,
        children: [...g.children]
          .map((c) => c.getBoundingClientRect())
          .filter((r) => r.width > 10)
          .map((r) => ({ left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) })),
      }));

    return { mainGap: getComputedStyle(main).gap, sections, gaps, grids };
  });

  console.log(`main gap: ${report.mainGap}\n`);

  console.log("SECTION HEIGHTS");
  report.sections.forEach((s) => console.log(`  ${String(s.height).padStart(5)}px  ${s.label}`));

  console.log("\nGAPS BETWEEN SECTIONS  (a value ~2x main gap means a divider is double-counting)");
  report.gaps.forEach((g) => console.log(`  ${String(g.gap).padStart(5)}px  after: ${g.after}`));

  console.log("\nGRID COLUMN EDGES  (sidebar rails should share a left edge)");
  report.grids.forEach((g) => {
    console.log(`  ${g.cols}`);
    g.children.forEach((c) => console.log(`     L${String(c.left).padStart(5)} R${String(c.right).padStart(5)} w${String(c.w).padStart(5)}`));
  });

  await browser.close();
})();
