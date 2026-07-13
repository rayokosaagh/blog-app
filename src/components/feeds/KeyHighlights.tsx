import * as cheerio from "cheerio";

/**
 * --- Key Highlights ---
 * Finds any h1-h4 heading whose text is exactly "Key Highlights", immediately
 * followed (as the next sibling element) by a <ul>, and replaces both with a
 * placeholder <div data-key-highlights-mount> containing the extracted items
 * as a JSON payload (in an inline <script type="application/json">), plus a
 * static, correctly-sized fallback card.
 *
 * This runs server-side over `post.content` before it's injected via
 * dangerouslySetInnerHTML, so — same as parseAlsoReadBlock — it can't render
 * real React/motion components itself. `<KeyHighlightsMount />` (client
 * component, mounted once per page) scans the DOM after hydration, reads the
 * JSON payload out of each placeholder, and boots an animated
 * <KeyHighlightsCard /> into it. The static fallback means there's no layout
 * shift and the block still reads fine with JS disabled.
 *
 * Uses cheerio for the same reason as parseAlsoReadBlock (see
 * components/AlsoRead.tsx) — structural sibling-adjacency checks instead of
 * regex backtracking risk.
 *
 * This replaces the old prop-driven `<KeyHighlights stats={...} />` React
 * component (which rendered a row of label/value badge chips from a typed
 * `stats: { label, value }[]` prop). That component took structured spec
 * data, not freeform HTML from the post body, so it isn't a drop-in
 * replacement for this function. If the old badge-chip component is still
 * used elsewhere (e.g. manually passed stats on a review template), keep it
 * separately — don't delete it just because the name overlaps.
 */
export function parseKeyHighlightsBlock(html: string): string {
  const $ = cheerio.load(html, null, false);
  let counter = 0;

  $("h1,h2,h3,h4").each((_, el) => {
    const $heading = $(el);
    if ($heading.text().trim().toLowerCase() !== "key highlights") return;

    const $next = $heading.next();
    if ($next.length === 0 || $next.get(0)?.tagName?.toLowerCase() !== "ul") return;

    const items = $next
      .find("li")
      .map((_, li) => $(li).text().trim())
      .get()
      .filter(Boolean);
    if (items.length === 0) return;

    counter += 1;
    $next.replaceWith(buildPlaceholder(items, counter));
    $heading.remove();
  });

  return $.html();
}

function buildPlaceholder(items: string[], index: number): string {
  // Escape `<` so item text containing e.g. "</script>" can't break out
  // of the embedded JSON payload.
  const payload = JSON.stringify(items).replace(/</g, "\\u003c");

  const fallbackRows = items
    .map(
      (item) => `
      <div style="position:relative;">
        <span style="position:absolute;left:-28px;top:6px;width:12px;height:12px;border-radius:50%;background:var(--accent);"></span>
        <span style="font-size:15px;line-height:1.65;color:var(--foreground);">${escapeHtml(item)}</span>
      </div>`
    )
    .join("");

  // IMPORTANT: keep this outer wrapper visually bare (spacing only). Same
  // "card inside a card" concern as buildPlaceholder() in AlsoRead.tsx —
  // KeyHighlightsMount clears the children and renders <KeyHighlightsCard>
  // straight into it, so all card chrome must live on the fallback element
  // below, which is wiped out entirely once JS mounts.
  return `
    <div class="key-highlights-placeholder not-prose" data-key-highlights-mount data-key-highlights-index="${index}" style="margin:2rem 0;">
      <div class="key-highlights-fallback-card" style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px 24px;">
        <p style="font-size:15px;font-weight:600;color:var(--foreground);margin:0 0 20px;">Key highlights</p>
        <div style="position:relative;padding-left:28px;">
          <span style="position:absolute;left:5px;top:6px;bottom:6px;width:2px;background:var(--border);"></span>
          <div style="display:flex;flex-direction:column;gap:22px;">${fallbackRows}</div>
        </div>
      </div>
      <script type="application/json" data-key-highlights-json>${payload}</script>
    </div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}