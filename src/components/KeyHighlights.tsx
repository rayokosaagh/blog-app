import * as cheerio from "cheerio";

/**
 * --- Key Highlights ---
 * Finds any h1-h4 heading whose text is exactly "Key Highlights", immediately
 * followed (as the next sibling element) by a <ul>, and replaces both with a
 * custom styled card: a connected timeline of points with a blue dot marker
 * per item.
 *
 * NOTE: This used to be a single global regex of the form
 *   /<(h[1-4]|p)([^>]*)>([\s\S]*?)<\/\1>\s*<ul([^>]*)>([\s\S]*?)<\/ul>/gi
 * That pattern is unsafe on large documents: the non-greedy content group
 * will backtrack/expand across the *entire* remaining document looking for
 * any "</p or /h> immediately followed by <ul>" pairing, which can
 * accidentally swallow the real Key Highlights block as a failed candidate
 * and consume it before the correct match is ever attempted. On short posts
 * this never manifested because there was nothing downstream to falsely
 * match against. Using a real DOM (cheerio) instead of regex avoids this
 * class of bug entirely, since sibling-adjacency is checked structurally
 * rather than via backtracking.
 *
 * This replaces the old prop-driven `<KeyHighlights stats={...} />` React
 * component (which rendered a row of label/value badge chips from a typed
 * `stats: { label, value }[]` prop). That component took structured spec
 * data, not freeform HTML from the post body, so it isn't a drop-in
 * replacement for this function — this is a pure string transform run over
 * `post.content` before it's injected via dangerouslySetInnerHTML, not a
 * rendered React component. If the old badge-chip component is still used
 * elsewhere (e.g. manually passed stats on a review template), keep it
 * separately — don't delete it just because the name overlaps.
 */
export function parseKeyHighlightsBlock(html: string): string {
  const $ = cheerio.load(html, null, false);

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

    const itemsHtml = items
      .map(
        (item: string) => `
        <div style="position:relative;">
          <span style="position:absolute;left:-28px;top:6px;width:12px;height:12px;border-radius:50%;background:var(--accent);"></span>
          <span style="font-size:15px;line-height:1.65;color:var(--foreground);">${item}</span>
        </div>`
      )
      .join("");

    const boxHtml = `
      <div class="not-prose" style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px 24px;margin:2rem 0;">
        <p style="font-size:15px;font-weight:600;color:var(--foreground);margin:0 0 20px;">Key highlights</p>
        <div style="position:relative;padding-left:28px;">
          <span style="position:absolute;left:5px;top:6px;bottom:6px;width:2px;background:var(--border);"></span>
          <div style="display:flex;flex-direction:column;gap:22px;">${itemsHtml}</div>
        </div>
      </div>`;

    $next.replaceWith(boxHtml);
    $heading.remove();
  });

  return $.html();
}