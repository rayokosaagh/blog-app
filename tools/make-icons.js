/**
 * Generates the PWA icon set in public/icons from an inline SVG.
 *
 * Deliberately font-free: the mark is built from rectangles (a headline over
 * two body lines, in the brutalist idiom the site already uses) rather than a
 * letterform, because the SVG rasteriser here has no guaranteed font stack and
 * a missing face renders as blank space rather than failing loudly.
 *
 *   node tools/make-icons.js
 *
 * Re-run after changing the palette below; the output is committed.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const INK = "#111111";
const PAPER = "#ffffff";
const ACCENT = "#ffe500"; // --accent-2, the brutalist highlight

/**
 * @param {number} pad Fraction of the canvas kept clear on every side.
 *   Android's maskable spec crops to a circle inscribed in the middle 80%, so
 *   a maskable icon needs the artwork pulled well inside that safe zone.
 */
function markSvg(pad) {
  const S = 512;
  const inner = S * (1 - pad * 2);
  const x0 = S * pad;

  // Bars laid out on a 4-row grid inside the safe area.
  const barX = x0 + inner * 0.12;
  const barW = inner * 0.76;
  const rows = [
    { y: 0.16, h: 0.2, w: 1, fill: ACCENT },
    { y: 0.45, h: 0.11, w: 1, fill: PAPER },
    { y: 0.62, h: 0.11, w: 1, fill: PAPER },
    { y: 0.79, h: 0.11, w: 0.6, fill: PAPER },
  ]
    .map(
      (r) =>
        `<rect x="${barX}" y="${x0 + inner * r.y}" width="${barW * r.w}" ` +
        `height="${inner * r.h}" fill="${r.fill}" />`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <rect width="${S}" height="${S}" fill="${INK}" />
  ${rows}
</svg>`;
}

async function main() {
  const outDir = path.join(__dirname, "..", "public", "icons");
  fs.mkdirSync(outDir, { recursive: true });

  const jobs = [
    { file: "icon-192.png", size: 192, pad: 0.08 },
    { file: "icon-512.png", size: 512, pad: 0.08 },
    { file: "icon-maskable-512.png", size: 512, pad: 0.2 },
    { file: "apple-touch-icon.png", size: 180, pad: 0.08 },
  ];

  for (const { file, size, pad } of jobs) {
    await sharp(Buffer.from(markSvg(pad))).resize(size, size).png().toFile(path.join(outDir, file));
    console.log("wrote", path.join("public", "icons", file));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
