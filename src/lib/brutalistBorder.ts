import { isValidHex, normalizeHex } from "@/lib/color";

/**
 * Neo-Brutalist outline + offset-shadow settings. Client-safe (no Prisma), so
 * the dashboard editor and the server share one coercion and one CSS builder.
 *
 * A null colour means "theme default", not a stored copy of it: dark mode's
 * default outline is derived from the admin's dark surfaces (see
 * darkSurfaceVars), so pinning it here would silently stop it following them.
 */
export type BorderColors = { border: string | null; shadow: string | null };
export type BrutalistBorder = { light: BorderColors; dark: BorderColors; blur: number };

export const SHADOW_BLUR_MIN = 0;
export const SHADOW_BLUR_MAX = 24;

export const BRUTALIST_BORDER_DEFAULT: BrutalistBorder = {
  light: { border: null, shadow: null },
  dark: { border: null, shadow: null },
  blur: 0,
};

// What globals.css ships for the brutalist shadow when no override is set.
// Light has none of its own — its shadow follows the outline colour.
export const BRUTALIST_DARK_SHADOW_DEFAULT = "#bbbbbb";
export const BRUTALIST_LIGHT_BORDER_DEFAULT = "#000000";

function colorFrom(v: unknown): string | null {
  return typeof v === "string" && isValidHex(v) ? normalizeHex(v) : null;
}

function colorsFrom(v: unknown): BorderColors {
  const src = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  return { border: colorFrom(src.border), shadow: colorFrom(src.shadow) };
}

/**
 * Coerce an untrusted payload (request body or stored JSON) into a complete,
 * valid value. Bad colours fall back to "theme default" and the blur is
 * clamped and rounded, so what gets stored is always renderable.
 */
export function brutalistBorderFrom(value: unknown): BrutalistBorder {
  const src = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const blur = Number(src.blur);
  return {
    light: colorsFrom(src.light),
    dark: colorsFrom(src.dark),
    blur: Number.isFinite(blur)
      ? Math.round(Math.min(SHADOW_BLUR_MAX, Math.max(SHADOW_BLUR_MIN, blur)))
      : 0,
  };
}

export function parseBrutalistBorder(raw: string | undefined | null): BrutalistBorder {
  if (!raw) return BRUTALIST_BORDER_DEFAULT;
  try {
    return brutalistBorderFrom(JSON.parse(raw));
  } catch {
    return BRUTALIST_BORDER_DEFAULT;
  }
}

function colorVars(c: BorderColors): string {
  return (
    (c.border ? `--border-heavy:${c.border};` : "") +
    (c.shadow ? `--shadow-color:${c.shadow};` : "")
  );
}

/**
 * Scoped overrides for the brutalist theme. Must be emitted after
 * darkSurfaceCss: both set --border-heavy on the same `.dark` selector, and the
 * later one wins. The light rule is `:not(.dark)` because a bare
 * [data-theme] rule outranks globals.css's `.dark` block and would leak the
 * light outline into dark mode.
 */
export function brutalistBorderCss(b: BrutalistBorder): string {
  const light = colorVars(b.light);
  const dark = colorVars(b.dark);
  return (
    (b.blur ? `html[data-theme='brutalist']{--shadow-blur:${b.blur}px}` : "") +
    (light ? `html[data-theme='brutalist']:not(.dark){${light}}` : "") +
    (dark ? `html[data-theme='brutalist'].dark{${dark}}` : "")
  );
}
