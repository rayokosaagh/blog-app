/**
 * Renders the public pages in a real browser at desktop and mobile widths and
 * reports what a visitor would actually hit: JS errors, failed requests,
 * horizontal overflow, missing/duplicate metadata, heading structure, image
 * alt/lazy coverage and undersized tap targets.
 *
 *   node tools/audit/site-audit.js
 *   AUDIT_BASE_URL=http://localhost:3000 node tools/audit/site-audit.js
 *
 * Writes tools/audit/.out/audit.json plus a screenshot per page/viewport.
 *
 * NOTE on "failed requests": against a PRODUCTION server most entries will be
 * `net::ERR_ABORTED` on page routes. That is Next's <Link> prefetching being
 * cancelled as the script scrolls and closes pages — not a real failure. Only
 * entries carrying an HTTP `status` are genuine.
 */
const fs = require("fs");
const path = require("path");
const {
  loadPlaywright,
  BASE,
  VIEWPORTS,
  PAGES,
  settle,
} = require("./lib/browser");

const OUT = path.join(__dirname, ".out");

(async () => {
  const { chromium } = loadPlaywright();
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const results = [];

  for (const [vpName, width, height] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width, height } });

    for (const [name, route] of PAGES) {
      const page = await ctx.newPage();
      const consoleMsgs = [];
      const pageErrors = [];
      const failedRequests = [];

      page.on("console", (m) => {
        if (m.type() === "error" || m.type() === "warning") {
          consoleMsgs.push({ type: m.type(), text: m.text().slice(0, 300) });
        }
      });
      page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 300)));
      page.on("requestfailed", (r) =>
        failedRequests.push({ url: r.url().slice(0, 200), err: r.failure()?.errorText })
      );
      page.on("response", (r) => {
        if (r.status() >= 400) failedRequests.push({ url: r.url().slice(0, 200), status: r.status() });
      });

      const started = Date.now();
      let navError = null;
      try {
        await page.goto(BASE + route, { waitUntil: "load", timeout: 90000 });
        await settle(page);
      } catch (e) {
        navError = String(e).slice(0, 200);
      }

      const audit = await page.evaluate(() => {
        const q = (s) => Array.from(document.querySelectorAll(s));
        const imgs = q("img");

        const smallTargets = [];
        q("a,button,input").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) return;
          // WCAG 2.2 (2.5.8) minimum target size.
          if (r.height < 24 || r.width < 24) {
            const label = (el.getAttribute("aria-label") || el.textContent || el.tagName).trim();
            smallTargets.push(`${label.slice(0, 26)} ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
        });

        const overflowers = [];
        if (document.documentElement.scrollWidth > window.innerWidth + 1) {
          q("*").forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.right > window.innerWidth + 2 && r.width > 20) {
              overflowers.push({
                tag: el.tagName,
                cls: String(el.className).slice(0, 80),
                right: Math.round(r.right),
              });
            }
          });
        }

        return {
          title: document.title,
          lang: document.documentElement.lang || null,
          metaDesc: document.querySelector('meta[name="description"]')?.content || null,
          canonical: document.querySelector("link[rel=canonical]")?.href || null,
          robots: document.querySelector('meta[name="robots"]')?.content || null,
          ogTitle: document.querySelector('meta[property="og:title"]')?.content || null,
          ogImage: document.querySelector('meta[property="og:image"]')?.content || null,
          jsonLd: q('script[type="application/ld+json"]').length,
          h1Count: q("h1").length,
          headings: q("h1,h2,h3").slice(0, 12).map((el) => `${el.tagName}:${el.textContent.trim().slice(0, 30)}`),
          newsletterInputs: q('input[type=email]').length,
          imgCount: imgs.length,
          imgsNoAlt: imgs.filter((i) => !i.hasAttribute("alt")).length,
          imgsLazy: imgs.filter((i) => i.loading === "lazy").length,
          smallTapTargets: [...new Set(smallTargets)].slice(0, 15),
          overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
          overflowers: overflowers.slice(0, 8),
        };
      });

      await page.screenshot({ path: path.join(OUT, `${vpName}-${name}.png`) });

      results.push({
        viewport: vpName,
        name,
        route,
        loadMs: Date.now() - started,
        navError,
        consoleMsgs: consoleMsgs.slice(0, 12),
        pageErrors: pageErrors.slice(0, 8),
        failedRequests: failedRequests.slice(0, 20),
        ...audit,
      });

      console.log(
        `[${vpName}] ${name.padEnd(9)} ${String(Date.now() - started).padStart(5)}ms ` +
          `errs=${pageErrors.length} console=${consoleMsgs.length} ` +
          `failed=${failedRequests.length} overflowX=${audit.overflowX} ` +
          `h1=${audit.h1Count} lazy=${audit.imgsLazy}/${audit.imgCount} small=${audit.smallTapTargets.length}`
      );
      await page.close();
    }
    await ctx.close();
  }

  await browser.close();

  fs.writeFileSync(path.join(OUT, "audit.json"), JSON.stringify(results, null, 2));

  const realHttpFailures = results.flatMap((r) => r.failedRequests.filter((f) => f.status));
  const pageErrs = results.reduce((n, r) => n + r.pageErrors.length, 0);
  console.log(`\nJS errors: ${pageErrs}   HTTP failures (>=400): ${realHttpFailures.length}`);
  console.log(`Full report -> ${path.join(OUT, "audit.json")}`);
})();
