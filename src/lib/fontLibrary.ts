/**
 * Custom fonts: the admin's font library (uploaded files or Google Fonts
 * families) and everything needed to turn it into CSS. Pure — no fs, no
 * Prisma — so the dashboard, the API routes and the root layout share it.
 *
 * Any font setting references a library font as `custom:<id>`. References
 * are resolved when CSS is built (typography.fontStack); one whose font was
 * deleted resolves to the theme font, so deleting a font never breaks a page.
 * Display names are only ever rendered as React text — CSS gets the internal
 * family (`cf-<id>`) or a FAMILY_RE-checked Google family, never the name.
 */

export type FontFileFormat = "woff2" | "woff" | "truetype" | "opentype";
export type FontFallback = "sans-serif" | "serif" | "monospace";
export type FontFileStyle = "normal" | "italic";

export type CustomFontFile = {
  url: string;
  format: FontFileFormat;
  /** One weight, or [min, max] for a variable font. */
  weight: number | [number, number];
  style: FontFileStyle;
};

type FontBase = { id: string; name: string; fallback: FontFallback };
export type UploadedFont = FontBase & { source: "upload"; files: CustomFontFile[] };
export type GoogleFont = FontBase & { source: "google"; family: string; weights: number[]; italic: boolean };
export type CustomFont = UploadedFont | GoogleFont;
export type CustomFontRef = `custom:${string}`;

export const MAX_FONTS = 20;
export const MAX_FILES_PER_FONT = 12;
export const FONT_FILE_MAX_BYTES = 5 * 1024 * 1024;
export const NAME_MAX = 40;

export const FONT_URL_RE = /^\/uploads\/fonts\/[a-z0-9]+\.(woff2|woff|ttf|otf)$/;
export const FAMILY_RE = /^[A-Za-z0-9 ]{1,40}$/;
const ID_RE = /^f_[a-z0-9]{8}$/;
const REF_RE = /^custom:f_[a-z0-9]{8}$/;

export const FONT_FALLBACKS: FontFallback[] = ["sans-serif", "serif", "monospace"];
export const FORMAT_EXT: Record<FontFileFormat, string> = { woff2: "woff2", woff: "woff", truetype: "ttf", opentype: "otf" };
export const EXT_FORMAT: Record<string, FontFileFormat> = { woff2: "woff2", woff: "woff", ttf: "truetype", otf: "opentype" };

export const isFontWeight = (w: unknown): w is number =>
  typeof w === "number" && Number.isInteger(w) && w >= 100 && w <= 900 && w % 100 === 0;
export const isCustomRef = (v: unknown): v is CustomFontRef => typeof v === "string" && REF_RE.test(v);
export const refOf = (font: CustomFont): CustomFontRef => `custom:${font.id}`;

export function findFont(ref: string, library: readonly CustomFont[]): CustomFont | null {
  return library.find((f) => refOf(f) === ref) ?? null;
}

export function newFontId(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return "f_" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function fileFrom(raw: unknown): CustomFontFile | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Record<string, unknown>;
  if (typeof f.url !== "string" || !FONT_URL_RE.test(f.url)) return null;
  const format = EXT_FORMAT[f.url.slice(f.url.lastIndexOf(".") + 1)];
  let weight: CustomFontFile["weight"];
  if (
    Array.isArray(f.weight) &&
    f.weight.length === 2 &&
    isFontWeight(f.weight[0]) &&
    isFontWeight(f.weight[1]) &&
    f.weight[0] < f.weight[1]
  ) {
    weight = [f.weight[0], f.weight[1]];
  } else if (isFontWeight(f.weight)) {
    weight = f.weight;
  } else {
    return null;
  }
  return { url: f.url, format, weight, style: f.style === "italic" ? "italic" : "normal" };
}

function fontFrom(raw: unknown): { font: CustomFont } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "Invalid font" };
  const s = raw as Record<string, unknown>;
  if (typeof s.id !== "string" || !ID_RE.test(s.id)) return { error: "Invalid font id" };
  const name = typeof s.name === "string" ? s.name.trim() : "";
  if (!name || name.length > NAME_MAX) return { error: `Font names must be 1–${NAME_MAX} characters` };
  const fallback = FONT_FALLBACKS.includes(s.fallback as FontFallback) ? (s.fallback as FontFallback) : "sans-serif";

  if (s.source === "upload") {
    if (!Array.isArray(s.files) || s.files.length === 0) return { error: `"${name}" needs at least one font file` };
    if (s.files.length > MAX_FILES_PER_FONT) return { error: `"${name}" has more than ${MAX_FILES_PER_FONT} files` };
    const files: CustomFontFile[] = [];
    for (const rawFile of s.files) {
      const file = fileFrom(rawFile);
      if (!file) return { error: `"${name}" has an invalid font file` };
      files.push(file);
    }
    return { font: { id: s.id, name, fallback, source: "upload", files } };
  }
  if (s.source === "google") {
    const family = typeof s.family === "string" ? s.family.trim().replace(/\s+/g, " ") : "";
    if (!FAMILY_RE.test(family)) return { error: "Google family names use letters, digits and spaces only" };
    const raws = Array.isArray(s.weights) ? new Set<unknown>(s.weights) : new Set<unknown>();
    const weights = [...raws].filter(isFontWeight).sort((a, b) => a - b);
    if (weights.length === 0 || weights.length !== raws.size) {
      return { error: `Pick valid weights (100–900) for "${family}"` };
    }
    return { font: { id: s.id, name, fallback, source: "google", family, weights, italic: s.italic === true } };
  }
  return { error: "Unknown font source" };
}

/** Strict: validate a whole library for saving. The first problem wins. */
export function customFontsFrom(input: unknown): { ok: true; fonts: CustomFont[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: "Invalid font list" };
  if (input.length > MAX_FONTS) return { ok: false, error: `At most ${MAX_FONTS} fonts` };
  const fonts: CustomFont[] = [];
  const ids = new Set<string>();
  for (const raw of input) {
    const r = fontFrom(raw);
    if ("error" in r) return { ok: false, error: r.error };
    if (ids.has(r.font.id)) return { ok: false, error: "Duplicate font id" };
    ids.add(r.font.id);
    fonts.push(r.font);
  }
  return { ok: true, fonts };
}

/** Lenient: read the stored library, dropping anything that no longer validates. */
export function parseCustomFonts(raw: string | null | undefined): CustomFont[] {
  if (!raw) return [];
  try {
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .flatMap((f) => {
        const r = fontFrom(f);
        return "font" in r ? [r.font] : [];
      })
      .slice(0, MAX_FONTS);
  } catch {
    return [];
  }
}

/** The family name CSS uses. Uploads get an internal name that can't collide with an installed font. */
export function customFamily(font: CustomFont): string {
  return font.source === "upload" ? `cf-${font.id}` : font.family;
}

export function customStack(font: CustomFont): string {
  return `"${customFamily(font)}", ${font.fallback}`;
}

export function customWeights(font: CustomFont): number[] {
  if (font.source === "google") return [...font.weights];
  const set = new Set<number>();
  for (const f of font.files) {
    if (Array.isArray(f.weight)) for (let w = f.weight[0]; w <= f.weight[1]; w += 100) set.add(w);
    else set.add(f.weight);
  }
  return [...set].sort((a, b) => a - b);
}

/** @font-face rules for every uploaded file. Browsers only download a face when text uses it. */
export function fontFaceCss(library: readonly CustomFont[]): string {
  return library
    .flatMap((font) =>
      font.source !== "upload"
        ? []
        : font.files.map(
            (f) =>
              `@font-face{font-family:"${customFamily(font)}";src:url("${f.url}") format("${f.format}");` +
              `font-weight:${Array.isArray(f.weight) ? f.weight.join(" ") : f.weight};font-style:${f.style};font-display:swap}`,
          ),
    )
    .join("");
}

/** One Google Fonts stylesheet URL for the given families, or null for none. */
export function googleHref(fonts: readonly GoogleFont[]): string | null {
  if (fonts.length === 0) return null;
  const params = fonts.map((f) => {
    const axis = f.italic
      ? `ital,wght@${[...f.weights.map((w) => `0,${w}`), ...f.weights.map((w) => `1,${w}`)].join(";")}`
      : `wght@${f.weights.join(";")}`;
    return `family=${f.family.replace(/ /g, "+")}:${axis}`;
  });
  return `https://fonts.googleapis.com/css2?${params.join("&")}&display=swap`;
}

/** Every `custom:<id>` string anywhere inside a settings value (heading/article/body font blobs). */
export function fontRefsIn(value: unknown): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") {
      if (REF_RE.test(v)) out.push(v);
    } else if (Array.isArray(v)) {
      v.forEach(walk);
    } else if (v && typeof v === "object") {
      Object.values(v).forEach(walk);
    }
  };
  walk(value);
  return out;
}

/** Only Google fonts some setting actually uses are requested from Google. */
export function googleFontsInUse(library: readonly CustomFont[], refs: Iterable<string>): GoogleFont[] {
  const used = new Set(refs);
  return library.filter((f): f is GoogleFont => f.source === "google" && used.has(refOf(f)));
}

/** Identify a font file from its first four bytes; null if it isn't one. */
export function sniffFontFormat(b: Uint8Array): FontFileFormat | null {
  if (b.length < 4) return null;
  const tag = String.fromCharCode(b[0], b[1], b[2], b[3]);
  if (tag === "wOF2") return "woff2";
  if (tag === "wOFF") return "woff";
  if (tag === "OTTO") return "opentype";
  if ((b[0] === 0 && b[1] === 1 && b[2] === 0 && b[3] === 0) || tag === "true") return "truetype";
  return null;
}

// Order matters: compound words before their suffixes ("SemiBold" before "Bold").
const WEIGHT_WORDS: [RegExp, number][] = [
  [/thin|hairline/i, 100],
  [/extra-?light|ultra-?light/i, 200],
  [/light/i, 300],
  [/medium/i, 500],
  [/semi-?bold|demi-?bold/i, 600],
  [/extra-?bold|ultra-?bold/i, 800],
  [/black|heavy/i, 900],
  [/bold/i, 700],
];

/** Best guess at a file's weight/style from its name ("Inter-SemiBoldItalic" → 600 italic). */
export function guessWeightStyle(fileName: string): { weight: number; style: FontFileStyle; variable: boolean } {
  const base = fileName.replace(/\.[^.]+$/, "");
  const hit = WEIGHT_WORDS.find(([re]) => re.test(base));
  return {
    weight: hit ? hit[1] : 400,
    style: /italic|oblique/i.test(base) ? "italic" : "normal",
    variable: /variable|\[wght|[-_ ]VF\b/i.test(base),
  };
}
