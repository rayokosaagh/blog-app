import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

export interface AlsoReadLink {
  href: string;
  text: string;
  /** Any extra attributes on the original <a> (target, rel, data-*, etc.), minus href. */
  attrs?: Record<string, string>;
}

/**
 * --- Also Read ---
 * Finds "Also read" blocks written in either of two shapes and replaces
 * each with a placeholder <div data-also-read-mount> containing the
 * extracted links as a JSON payload (in an inline <script type="application/json">):
 *
 *   1. Label-as-first-item: a <ul> whose first <li> text starts with
 *      "Also read", with the rest of the <li>s being the actual links.
 *        Also read
 *        - Link one
 *        - Link two
 *
 *   2. Label-as-heading: any heading (h1–h6) or <p> whose own text starts
 *      with "Also read" (and is short — a real heading that merely opens
 *      with those words won't match), immediately followed by a <ul> of
 *      links. Empty paragraphs between the label and the list are allowed
 *      and get cleaned up too.
 *        ## Also read
 *        - Link one
 *        - Link two
 *
 * This runs server-side over `post.content` before it's injected via
 * dangerouslySetInnerHTML, so it can't render real React/motion components
 * itself — it just prepares the data and a static, correctly-sized fallback
 * card. `<AlsoReadMount />` (client component, mounted once per page) scans
 * the DOM after hydration, reads the JSON payload out of each placeholder,
 * and boots an animated <AlsoReadCard /> into it. The static fallback means
 * there's no layout shift and the block still reads fine with JS disabled.
 *
 * Uses cheerio for the same reason as parseKeyHighlightsBlock (see
 * components/KeyHighlights.tsx) — structural sibling/child checks instead of
 * regex backtracking risk — and to keep both block parsers on the same
 * DOM-based approach as post content grows.
 */
export function parseAlsoReadBlock(html: string): string {
  const $ = cheerio.load(html, null, false);
  let counter = 0;

  // --- Pattern 1: label is the list's own first <li> ---
  $("ul").each((_, el) => {
    const $ul = $(el);
    const $items = $ul.children("li");
    if ($items.length < 2) return;

    const firstText = $items.first().text().trim().toLowerCase();
    if (!firstText.startsWith("also read")) return;

    const links = extractLinksFromItems($, $items.slice(1));
    if (links.length === 0) return;

    counter += 1;
    $ul.replaceWith(buildPlaceholder(links, counter));
  });

  // --- Pattern 2: label is its own heading/paragraph, list follows it ---
  $("h1, h2, h3, h4, h5, h6, p").each((_, el) => {
    const $label = $(el);
    if ($label.closest("[data-also-read-mount]").length) return;

    const labelText = $label.text().replace(/&nbsp;/g, " ").trim();
    // Keep this short — lets a real heading that happens to start with
    // "Also read..." (unlikely, but not impossible) pass through untouched
    // instead of being swallowed as a label.
    if (labelText.length > 40) return;
    if (!labelText.toLowerCase().startsWith("also read")) return;

    const found = findFollowingList($, el);
    if (!found) return;

    const links = extractLinksFromItems($, found.$list.children("li"));
    if (links.length === 0) return;

    counter += 1;
    $label.replaceWith(buildPlaceholder(links, counter));
    found.emptyNodesBetween.forEach((node) => $(node).remove());
    found.$list.remove();
  });

  return $.html();
}

function extractLinksFromItems($: cheerio.CheerioAPI, $items: cheerio.Cheerio<AnyNode>): AlsoReadLink[] {
  const links: AlsoReadLink[] = [];
  $items.each((_, li) => {
    const $a = $(li).find("a").first();
    if ($a.length === 0) return;
    const href = $a.attr("href");
    if (!href) return;

    const attribs = ($a.get(0) as any)?.attribs || {};
    const attrs: Record<string, string> = {};
    Object.keys(attribs).forEach((key) => {
      if (key === "href") return;
      attrs[key] = attribs[key];
    });

    links.push({ href, text: $a.text().trim(), attrs: Object.keys(attrs).length ? attrs : undefined });
  });
  return links;
}

/**
 * Walks forward from `start` looking for the next <ul>. Empty paragraphs
 * (common WYSIWYG cruft between a heading and a list) are skipped and
 * collected for removal. Bails (returns null) the moment it hits any
 * element with real content that isn't the list itself, so unrelated
 * content never gets swallowed.
 */
function findFollowingList(
  $: cheerio.CheerioAPI,
  start: AnyNode
): { $list: cheerio.Cheerio<AnyNode>; emptyNodesBetween: AnyNode[] } | null {
  let $cursor = $(start).next();
  const emptyNodesBetween: AnyNode[] = [];

  while ($cursor.length) {
    if ($cursor.is("ul")) {
      return { $list: $cursor, emptyNodesBetween };
    }

    const text = $cursor.text().replace(/&nbsp;/g, " ").trim();
    const hasContent = text.length > 0 || $cursor.find("img, a").length > 0;
    if (hasContent) return null;

    emptyNodesBetween.push($cursor.get(0)!);
    $cursor = $cursor.next();
  }

  return null;
}

function buildPlaceholder(links: AlsoReadLink[], index: number): string {
  // Escape `<` so link text containing e.g. "</script>" can't break out
  // of the embedded JSON payload.
  const payload = JSON.stringify(links).replace(/</g, "\\u003c");

  const fallbackRows = links
    .map(
      (link, i) => `
      <a href="${link.href}"${attrsToHtml(link.attrs)} style="display:flex;align-items:center;gap:14px;padding:10px 0;text-decoration:none;">
        <span style="flex-shrink:0;width:19px;height:19px;border-radius:9999px;border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--accent);background:var(--card);">${i + 1}</span>
        <span style="flex:1;font-size:14px;line-height:1.4;color:var(--foreground);">${escapeHtml(link.text)}</span>
      </a>`
    )
    .join("");

  // IMPORTANT: this outer wrapper must stay visually bare (spacing only,
  // no border/background/radius). AlsoReadMount clears its children and
  // renders <AlsoReadCard> straight into it — if this wrapper also carried
  // card styling, the fallback card below would sit visually nested inside
  // the mounted AlsoReadCard's own identical card styling, which is exactly
  // the "card inside a card" bug this comment is here to prevent regressing.
  // All card chrome lives on .also-read-fallback-card instead, which gets
  // wiped out entirely once JS mounts.
  return `
    <div class="also-read-placeholder not-prose" data-also-read-mount data-also-read-index="${index}" style="margin:2rem 0;">
      <div class="also-read-fallback-card" style="position:relative;border-radius:16px;border:1px solid var(--border);background:linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, var(--muted)) 0%, var(--muted) 55%);padding:20px 24px;">
        <p style="font-size:14px;font-weight:600;color:var(--foreground);margin:0 0 4px;display:flex;align-items:center;gap:8px;">
          <span style="width:22px;height:22px;border-radius:9999px;background:var(--accent);color:var(--background);font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;">&#8618;</span>
          Also read
        </p>
        <div>${fallbackRows}</div>
      </div>
      <script type="application/json" data-also-read-json>${payload}</script>
    </div>`;
}

function attrsToHtml(attrs?: Record<string, string>): string {
  if (!attrs) return "";
  return Object.entries(attrs)
    .map(([key, value]) => ` ${key}="${escapeHtml(value)}"`)
    .join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}