/**
 * Resolves Playwright without pinning it as a project dependency.
 *
 * Tries a normal require first (works if you `npm i -D playwright`), then falls
 * back to the npx cache, which is where `npx playwright` leaves it. Keeping the
 * fallback means these scripts run on a machine that has only ever used npx.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");

function loadPlaywright() {
  try {
    return require("playwright");
  } catch {
    /* fall through to the npx cache */
  }

  const cache = path.join(os.homedir(), "AppData", "Local", "npm-cache", "_npx");
  if (fs.existsSync(cache)) {
    for (const entry of fs.readdirSync(cache)) {
      const candidate = path.join(cache, entry, "node_modules", "playwright");
      if (fs.existsSync(candidate)) return require(candidate);
    }
  }

  throw new Error(
    "Playwright not found. Install it with:  npm i -D playwright && npx playwright install chromium"
  );
}

const BASE = process.env.AUDIT_BASE_URL || "http://localhost:3000";

const VIEWPORTS = [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
];

/** Public routes worth checking. `post` and `product` need real slugs. */
const PAGES = [
  ["home", "/"],
  ["blog", "/blog"],
  ["products", "/products"],
  ["compare", "/compare"],
  ["search", "/search?q=phone"],
  ["login", "/login"],
];

/**
 * Scrolls the full page so lazy images load and sticky/in-view animations
 * settle, then returns to the top. Layout measurements taken before this are
 * unreliable, because lazy images resize their containers as they arrive.
 */
async function settle(page, waitMs = 2000) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(waitMs);
}

/** Removes the popup ad overlay, which otherwise covers screenshots. */
async function dismissPopupAd(page) {
  await page.evaluate(() =>
    document
      .querySelectorAll(".popup-ad-backdrop, [class*='popup-ad']")
      .forEach((e) => e.remove())
  );
}

module.exports = { loadPlaywright, BASE, VIEWPORTS, PAGES, settle, dismissPopupAd };
