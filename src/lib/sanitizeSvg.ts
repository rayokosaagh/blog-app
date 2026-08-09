function extractSvg(input: string): string | null {
  const match = input.match(/<svg[\s\S]*?<\/svg>/i);
  return match ? match[0] : null;
}

export function isSvgIcon(icon: string): boolean {
  return extractSvg(icon) !== null;
}

function parseStyleRules(styleContent: string): Map<string, string> {
  const rules = new Map<string, string>();
  const ruleRegex = /\.([a-zA-Z0-9_-]+)\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = ruleRegex.exec(styleContent)) !== null) {
    const [, className, declarations] = match;
    const cleanDecls = declarations.trim().replace(/\s+/g, " ");
    if (cleanDecls) {
      const existing = rules.get(className);
      rules.set(className, existing ? `${existing} ${cleanDecls}` : cleanDecls);
    }
  }
  return rules;
}

function inlineStyles(svg: string, rules: Map<string, string>): string {
  if (rules.size === 0) return svg;

  return svg.replace(/<([a-zA-Z]+)([^>]*?)\sclass\s*=\s*(["'])(.*?)\3([^>]*)>/gi,
    (full, tag, before, quote, classNames, after) => {
      const classes = classNames.trim().split(/\s+/);
      const merged = classes
        .map((c: string) => rules.get(c))
        .filter(Boolean)
        .join(" ");

      if (!merged) return full;

      const styleMatch = (before + after).match(/style\s*=\s*(["'])(.*?)\1/i);
      const priorStyle = styleMatch ? styleMatch[2].trim().replace(/;?$/, ";") : "";
      const newStyle = `${priorStyle} ${merged}`.trim();

      const withoutOldStyle = (before + after).replace(/\sstyle\s*=\s*(["']).*?\1/i, "");
      return `<${tag}${withoutOldStyle} style="${newStyle}">`;
    }
  );
}

function toRgb(value: string): [number, number, number] | null {
  const v = value.trim().toLowerCase();
  if (v === "currentcolor" || v === "none" || v === "transparent" || v.startsWith("url(")) {
    return null;
  }
  if (v === "black") return [0, 0, 0];
  if (v === "white") return [255, 255, 255];

  const hex3 = v.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  if (hex3) {
    const [, r, g, b] = hex3;
    return [parseInt(r + r, 16), parseInt(g + g, 16), parseInt(b + b, 16)];
  }
  const hex6 = v.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/);
  if (hex6) {
    const [, r, g, b] = hex6;
    return [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)];
  }
  const rgb = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) {
    return [parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3])];
  }
  return null;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const toLinear = (c: number) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const CONTRAST_THRESHOLD = 3;

// Counts distinct explicit colors used anywhere in the icon (fill/stroke
// attributes and inline style declarations). This is the key signal for
// whether it's safe to auto-correct: a single-color icon (Samsung's blue
// wordmark, ASUS's near-black gray) can be swapped to `currentColor`
// per-theme with no loss of meaning. A multi-color icon (Xiaomi's orange
// badge with a white cutout) encodes its design IN the color relationships
// between shapes — swapping any one of those colors independently of the
// others collapses the design. So multi-color icons are left completely
// untouched, in both themes, trusting the original authored contrast.
function getDistinctColorCount(svg: string): number {
  const values: string[] = [];
  const attrRegex = /\b(?:fill|stroke)\s*=\s*("|')([^"']*)\1/gi;
  let m: RegExpExecArray | null;
  while ((m = attrRegex.exec(svg))) values.push(m[2]);
  const styleRegex = /\b(?:fill|stroke)\s*:\s*([^;"']+)/gi;
  while ((m = styleRegex.exec(svg))) values.push(m[1]);

  const distinct = new Set<string>();
  for (const v of values) {
    const rgb = toRgb(v);
    if (rgb) distinct.add(rgb.join(","));
  }
  return distinct.size;
}
const NEAR_BACKGROUND_DELTA = 0.15;

function neutralizeForBackground(svg: string, bgLuminance: number): string {
  const isNearBackground = (value: string): boolean => {
    const rgb = toRgb(value);
    if (!rgb) return false;
    return Math.abs(relativeLuminance(rgb) - bgLuminance) < NEAR_BACKGROUND_DELTA;
  };

  let out = svg.replace(
    /\b(fill|stroke)\s*=\s*("|')([^"']*)\2/gi,
    (m, attr, q, value) => (isNearBackground(value) ? `${attr}=${q}currentColor${q}` : m)
  );

  out = out.replace(
    /\b(fill|stroke)\s*:\s*([^;"']+)/gi,
    (m, prop, value) => (isNearBackground(value.trim()) ? `${prop}:currentColor` : m)
  );

  if (bgLuminance < 0.5) {
    out = out.replace(/<svg([^>]*)>/i, (m, attrs) =>
      /\bfill\s*=/i.test(attrs) ? m : `<svg${attrs} fill="currentColor">`
    );
  }

  return out;
}

export type TagColorMode = "AUTO" | "KEEP_ORIGINAL" | "FORCE_MONO" | "CUSTOM";

/** True for a `#rrggbb` / `#rgb` string — the only colors we'll inline. */
export function isTagColor(value: unknown): value is string {
  return typeof value === "string" && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

/**
 * Normalise an untrusted colorMode/color pair from a request body.
 *
 * CUSTOM without a usable hex falls back to AUTO rather than persisting a mode
 * the renderer can't satisfy. The color itself is kept whenever it's valid,
 * even for other modes, so flipping a tag to AUTO and back doesn't silently
 * throw away the brand color the admin picked.
 */
export function resolveTagColor(
  rawMode: unknown,
  rawColor: unknown,
): { colorMode: TagColorMode; color: string | null } {
  const color = isTagColor(rawColor) ? rawColor.trim().toLowerCase() : null;

  const colorMode: TagColorMode =
    rawMode === "CUSTOM"
      ? color
        ? "CUSTOM"
        : "AUTO"
      : rawMode === "KEEP_ORIGINAL" || rawMode === "FORCE_MONO"
        ? rawMode
        : "AUTO";

  return { colorMode, color };
}

export function sanitizeSvgForTheme(
  input: string,
  theme: "light" | "dark",
  colorMode: TagColorMode = "AUTO"
): string {
  const svg = extractSvg(input);
  let clean = (svg ?? input).trim();

  clean = clean.replace(/<script[\s\S]*?<\/script>/gi, "");

  const styleMatch = clean.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (styleMatch) {
    const rules = parseStyleRules(styleMatch[1]);
    clean = inlineStyles(clean, rules);
  }
  clean = clean.replace(/<style[\s\S]*?<\/style>/gi, "");

  clean = clean.replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "");
  clean = clean.replace(/(href|src|xlink:href)\s*=\s*("|')\s*javascript:[^"']*("|')/gi, "");
  clean = clean.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "");

  if (colorMode === "KEEP_ORIGINAL") {
    return clean;
  }

  // FORCE_MONO and CUSTOM are the same transform — flatten the icon to a
  // single color by removing every explicit fill/stroke so the whole thing
  // inherits currentColor. They differ only in what currentColor resolves to,
  // which is the caller's job: FORCE_MONO leaves it as the surrounding text
  // color, CUSTOM sets it to the tag's chosen hex (see TagIcon).
  if (colorMode === "FORCE_MONO" || colorMode === "CUSTOM") {
    clean = clean.replace(/\b(fill|stroke)\s*=\s*("|')[^"']*\2/gi, "");
    clean = clean.replace(/\b(fill|stroke)\s*:\s*[^;"']+;?/gi, "");
    clean = clean.replace(/<svg([^>]*)>/i, (m, attrs) => `<svg${attrs} fill="currentColor">`);
    return clean;
  }

  // AUTO — only correct single-color icons, leave multi-color icons alone
  if (getDistinctColorCount(clean) <= 1) {
    const bgLuminance = theme === "dark" ? 0 : 1;
    clean = neutralizeForBackground(clean, bgLuminance);
  }

  return clean;
}

export function sanitizeSvg(input: string): string {
  return sanitizeSvgForTheme(input, "light", "AUTO");
}