import * as cheerio from "cheerio";

/**
 * --- Image Gallery ---
 * Finds paragraphs whose text is a `[gallery]url1 | url2 | ...[/gallery]`
 * shortcode (inserted by the editor's Gallery button) and replaces them with a
 * placeholder `<div data-gallery-mount>` carrying the image URLs as a JSON
 * payload, plus a static first-image fallback.
 *
 * Runs server-side over post.content before it's injected via
 * dangerouslySetInnerHTML (same pattern as parseKeyHighlightsBlock), so it
 * can't render React itself. `<GalleryMount />` scans the DOM after hydration,
 * reads the payload, and boots a real <ImageCarousel /> into the placeholder.
 *
 * Uses `.text()` so the shortcode is recognised even if the editor auto-linked
 * the URLs into <a> tags inside the paragraph.
 */
export function parseGalleryBlock(html: string): string {
  const $ = cheerio.load(html, null, false);
  let counter = 0;

  $("p").each((_, el) => {
    const $p = $(el);
    const text = $p.text().trim();
    const match = text.match(/^\[gallery\]([\s\S]*)\[\/gallery\]$/i);
    if (!match) return;

    const urls = match[1]
      .split(/[|\n]/)
      .map((u) => u.trim())
      .filter((u) => /^(https?:\/\/|\/)/.test(u));
    if (urls.length === 0) return;

    counter += 1;
    $p.replaceWith(buildGalleryPlaceholder(urls, counter));
  });

  return $.html();
}

function buildGalleryPlaceholder(urls: string[], index: number): string {
  // Escape `<` so a URL containing "</script>" can't break out of the payload.
  const payload = JSON.stringify(urls).replace(/</g, "\\u003c");
  const first = escapeAttr(urls[0]);

  // The stage height here deliberately mirrors ImageCarousel's fixed stage
  // (h-[360px] / sm:460 / lg:540). If the two disagree, the photo visibly
  // resizes the moment GalleryMount swaps the placeholder for the real
  // carousel — the same "images are different sizes" symptom, just on hydration.
  return `
    <div class="gallery-placeholder not-prose" data-gallery-mount data-gallery-index="${index}" style="margin:2rem 0;">
      <div class="relative w-full h-[360px] sm:h-[460px] lg:h-[540px] overflow-hidden border-2 border-border-heavy bg-card">
        <img loading="lazy" decoding="async" src="${first}" alt="" aria-hidden="true"
          class="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-2xl" />
        <img loading="lazy" decoding="async" src="${first}" alt=""
          class="absolute inset-0 z-[1] h-full w-full object-contain" />
      </div>
      <script type="application/json" data-gallery-json>${payload}</script>
    </div>`;
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
