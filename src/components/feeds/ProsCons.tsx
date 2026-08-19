import * as cheerio from "cheerio";

/**
 * --- Pros & Cons ---
 * Finds an h1-h4 heading whose text is exactly "Pros" (or "Cons"), takes the
 * items that follow it — either a <ul>/<ol> or a run of <p> paragraphs, since
 * the editor emits both — and replaces the whole run with a placeholder
 * <div data-pros-cons-mount> carrying the extracted items as a JSON payload,
 * plus a static fallback card.
 *
 * When a "Cons" heading follows directly after the pros items (the usual way an
 * editor writes this), both are folded into ONE placeholder so they
 * render as a single two-column card rather than two stacked ones. A lone
 * "Pros" or "Cons" block still works and renders a single column.
 *
 * Same architecture as parseKeyHighlightsBlock / parseAlsoReadBlock: this runs
 * server-side over `post.content` before it's injected via
 * dangerouslySetInnerHTML, so it can't render React itself. <ProsConsMount />
 * boots the real animated card into each placeholder after hydration. The
 * fallback keeps the block readable with JS disabled and avoids layout shift.
 */

type Kind = "pros" | "cons";

function kindOf(text: string): Kind | null {
  const t = text.trim().toLowerCase().replace(/[:：]$/, "");
  if (t === "pros" || t === "pro" || t === "the good") return "pros";
  if (t === "cons" || t === "con" || t === "the bad") return "cons";
  return null;
}

// Structural shape rather than cheerio's generic Cheerio<T> — the element type
// differs across cheerio's overloads and pinning it fights inference.
type NodeSet = { length: number; get(i: number): { tagName?: string } | undefined };

// What $(...) and .next() actually return in this cheerio version.
type Nodes = ReturnType<cheerio.CheerioAPI>;

function tagOf($el: NodeSet): string {
  return $el.length > 0 ? ($el.get(0)?.tagName?.toLowerCase() ?? "") : "";
}

function isHeading($el: NodeSet): boolean {
  return /^h[1-4]$/.test(tagOf($el));
}

/**
 * Collect the items that follow a Pros/Cons heading.
 *
 * Accepts BOTH shapes, because the editor produces either depending on whether
 * the author used the bullet-list button:
 *   - a <ul>/<ol>, one <li> per item
 *   - a run of consecutive <p> elements, one paragraph per item
 *
 * Collection stops at the next heading or at anything that isn't a paragraph or
 * list (an image, table, blockquote…), so a Pros section can't swallow the rest
 * of the article. Empty paragraphs are consumed as separators but contribute no
 * item. Returns the consumed nodes so the caller can remove them, and the
 * element that stopped the run so it can check for a paired Cons block.
 */
function collectAfter(
  $: cheerio.CheerioAPI,
  $from: Nodes,
): { items: string[]; nodes: unknown[]; stop: Nodes } {
  const items: string[] = [];
  const nodes: unknown[] = [];
  let $cur = $from.next();

  while ($cur.length > 0) {
    const tag = tagOf($cur);

    if (tag === "ul" || tag === "ol") {
      const lis = $cur
        .find("li")
        .map((_, li) => $(li).text().trim())
        .get()
        .filter(Boolean);
      items.push(...lis);
      nodes.push($cur.get(0));
    } else if (tag === "p") {
      // &nbsp; is common from the editor and shouldn't count as content.
      const text = $cur.text().replace(/ /g, " ").trim();
      if (text) items.push(text);
      nodes.push($cur.get(0));
    } else {
      break;
    }

    $cur = $cur.next();
  }

  return { items, nodes, stop: $cur };
}

export function parseProsConsBlock(html: string): string {
  const $ = cheerio.load(html, null, false);
  let counter = 0;

  // Headings already folded into an earlier block's placeholder, so the
  // second pass doesn't emit a duplicate card for them.
  const consumed = new Set<unknown>();

  $("h1,h2,h3,h4").each((_, el) => {
    if (consumed.has(el)) return;

    const $heading = $(el);
    const kind = kindOf($heading.text());
    if (!kind) return;

    const first = collectAfter($, $heading);
    if (first.items.length === 0) return;

    // Optional paired block immediately after, e.g. "Pros … Cons …".
    let pairKind: Kind | null = null;
    let pairItems: string[] = [];
    let pairNodes: unknown[] = [];
    const $pairHeading = first.stop;

    if (isHeading($pairHeading)) {
      const k = kindOf($pairHeading.text());
      if (k && k !== kind) {
        const second = collectAfter($, $pairHeading);
        if (second.items.length > 0) {
          pairKind = k;
          pairItems = second.items;
          pairNodes = second.nodes;
          consumed.add($pairHeading.get(0));
        }
      }
    }

    const pros = kind === "pros" ? first.items : pairKind === "pros" ? pairItems : [];
    const cons = kind === "cons" ? first.items : pairKind === "cons" ? pairItems : [];

    counter += 1;
    // Insert the placeholder where the first heading was, then drop everything
    // the two blocks consumed.
    $heading.replaceWith(buildPlaceholder(pros, cons, counter));
    for (const node of [...first.nodes, ...pairNodes]) {
      if (node) $(node as Parameters<cheerio.CheerioAPI>[0]).remove();
    }
    if (pairKind) $pairHeading.remove();
  });

  return $.html();
}

const PROS_COLOR = "#22c55e";
const CONS_COLOR = "#f43f5e";

// Mirrors <ProsConsCard> so the swap at hydration is invisible: same token-
// driven chrome (--border-width / --border-heavy / --radius / --shadow-md),
// same header band, same row rhythm, so nothing reflows. Written out longhand
// because this HTML is injected into `post.content` and can't use the
// `surface-*` utility classes the React card gets. The tick and cross glyphs
// are the one thing it can't reproduce (they're lucide icons), so it draws the
// tinted chip they sit in and leaves it empty.
function fallbackPanel(title: string, items: string[], color: string): string {
  if (items.length === 0) return "";
  const rows = items
    .map(
      (item) => `
      <li style="display:flex;gap:12px;align-items:flex-start;margin:0 0 12px;">
        <span style="flex:none;width:20px;height:20px;margin-top:3px;background:color-mix(in srgb, ${color} 16%, transparent);border-radius:var(--radius-pill,0);"></span>
        <span style="font-size:15px;line-height:1.65;color:var(--foreground);">${escapeHtml(item)}</span>
      </li>`
    )
    .join("");

  return `
    <div style="min-width:0;overflow:hidden;background-color:var(--card);border-width:var(--border-width);border-style:solid;border-color:var(--border-heavy);border-radius:var(--radius);box-shadow:var(--shadow-md);">
      <div style="display:flex;align-items:center;gap:10px;padding:14px 20px;background-color:color-mix(in srgb, ${color} 9%, transparent);border-bottom-width:var(--border-width);border-bottom-style:solid;border-bottom-color:color-mix(in srgb, ${color} 24%, transparent);">
        <span style="flex:none;width:28px;height:28px;background:${color};border-radius:var(--radius-pill,0);"></span>
        <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;color:${color};">${escapeHtml(title)}</span>
      </div>
      <ul style="list-style:none;padding:16px 20px 4px;margin:0;">${rows}</ul>
    </div>`;
}

function buildPlaceholder(pros: string[], cons: string[], index: number): string {
  // Escape `<` so item text containing e.g. "</script>" can't break out of the
  // embedded JSON payload.
  const payload = JSON.stringify({ pros, cons }).replace(/</g, "\\u003c");

  // Keep this outer wrapper visually bare (spacing only) — ProsConsMount wipes
  // the children and renders <ProsConsCard> straight into it, so all panel
  // chrome must live on the fallback below.
  return `
    <div class="pros-cons-placeholder not-prose" data-pros-cons-mount data-pros-cons-index="${index}" style="margin:2rem 0;">
      <div class="pros-cons-fallback-card${pros.length > 0 && cons.length > 0 ? " pros-cons-fallback-split" : ""}">
        ${fallbackPanel("Pros", pros, PROS_COLOR)}
        ${fallbackPanel("Cons", cons, CONS_COLOR)}
      </div>
      <script type="application/json" data-pros-cons-json>${payload}</script>
    </div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
