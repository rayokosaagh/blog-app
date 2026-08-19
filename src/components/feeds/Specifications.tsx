import * as cheerio from "cheerio";

export interface SpecItem {
  label: string;
  value: string;
}

/**
 * --- Specifications ---
 * Same mechanism as parseKeyHighlightsBlock: finds an h1-h4 heading whose
 * text contains "Specifications", immediately followed by a <ul>, and
 * replaces both with a placeholder containing a JSON payload of
 * { title, items: { label, value }[] } plus a static fallback card.
 * SpecificationsMount hydrates the real <SpecificationsCard> into the
 * placeholder client-side, using the captured heading as the card title.
 */
export function parseSpecificationsBlock(html: string): string {
  const $ = cheerio.load(html, null, false);
  let counter = 0;

  $("h1,h2,h3,h4").each((_, el) => {
    const $heading = $(el);
    const headingText = $heading.text().trim();
    if (!/\bspecifications\b/i.test(headingText)) return;

    const $next = $heading.next();
    if ($next.length === 0 || $next.get(0)?.tagName?.toLowerCase() !== "ul") return;

    const items: SpecItem[] = $next
      .find("li")
      .map((_, li) => {
        const text = $(li).text().replace(/\s+/g, " ").trim();
        const colonIdx = text.indexOf(":");
        if (colonIdx === -1) return null;
        const label = text.slice(0, colonIdx).trim();
        const value = text.slice(colonIdx + 1).trim();
        if (!label || !value) return null;
        return { label, value };
      })
      .get()
      .filter((item): item is SpecItem => item !== null);

    if (items.length === 0) return;

    counter += 1;
    // Carry the authored level so the card renders the heading the editor
    // chose (H1 = kicker, H2 = title, H3 = sub-heading) instead of one fixed style.
    $next.replaceWith(buildPlaceholder(items, counter, headingText, (el.tagName || "h2").toLowerCase()));
    $heading.remove();
  });

  return $.html();
}

function buildPlaceholder(items: SpecItem[], index: number, title: string, level: string): string {
  const payload = JSON.stringify({ title, level, items }).replace(/</g, "\\u003c");

  const fallbackRows = items
    .map(
      (item) => `
      <div style="padding:12px 0;border-bottom:1px solid var(--border);">
        <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:var(--muted-foreground);margin:0 0 4px;">${escapeHtml(item.label)}</p>
        <p style="font-size:14px;font-weight:600;color:var(--foreground);margin:0;">${escapeHtml(item.value)}</p>
      </div>`
    )
    .join("");

  return `
    <div class="specifications-placeholder not-prose" data-specifications-mount data-specifications-index="${index}" style="margin:2rem 0;">
      <div class="specifications-fallback-card" style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px 24px;">
        <p style="font-size:15px;font-weight:600;color:var(--foreground);margin:0 0 8px;">${escapeHtml(title)}</p>
        <div>${fallbackRows}</div>
      </div>
      <script type="application/json" data-specifications-json>${payload}</script>
    </div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}