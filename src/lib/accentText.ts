import { isValidHex, normalizeHex, type UiThemeName } from "@/lib/color";

/**
 * Optional text colours for content sitting on an accent fill (--on-accent*).
 * Client-safe (no Prisma), shared by the dashboard and the server.
 *
 * null means "auto": the contrast-derived colour from lib/color's onColor(),
 * which is what every theme shipped with. An override only replaces that for
 * one accent in one theme + scheme, so it can never strand the others.
 */
export const ACCENT_KEYS = ["accent", "accent2", "accent3"] as const;
export type AccentKey = (typeof ACCENT_KEYS)[number];

export type AccentTextSet = Record<AccentKey, string | null>;
export type AccentTextByScheme = { light: AccentTextSet; dark: AccentTextSet };
export type AccentText = Record<UiThemeName, AccentTextByScheme>;

const AUTO_SET: AccentTextSet = { accent: null, accent2: null, accent3: null };

export const ACCENT_TEXT_DEFAULT: AccentText = {
  brutalist: { light: AUTO_SET, dark: AUTO_SET },
  modern: { light: AUTO_SET, dark: AUTO_SET },
};

// The token each accent's text colour lives in.
const TOKEN: Record<AccentKey, string> = {
  accent: "--on-accent",
  accent2: "--on-accent-2",
  accent3: "--on-accent-3",
};

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function setFrom(v: unknown): AccentTextSet {
  const src = obj(v);
  const pick = (k: AccentKey) => {
    const c = src[k];
    return typeof c === "string" && isValidHex(c) ? normalizeHex(c) : null;
  };
  return { accent: pick("accent"), accent2: pick("accent2"), accent3: pick("accent3") };
}

/**
 * Coerce an untrusted payload (request body or stored JSON) into a complete
 * value. Anything invalid falls back to auto, so a bad write can only ever
 * restore the shipped behaviour.
 */
export function accentTextFrom(value: unknown): AccentText {
  const src = obj(value);
  const scheme = (t: UiThemeName): AccentTextByScheme => {
    const s = obj(src[t]);
    return { light: setFrom(s.light), dark: setFrom(s.dark) };
  };
  return { brutalist: scheme("brutalist"), modern: scheme("modern") };
}

export function parseAccentText(raw: string | undefined | null): AccentText {
  if (!raw) return ACCENT_TEXT_DEFAULT;
  try {
    return accentTextFrom(JSON.parse(raw));
  } catch {
    return ACCENT_TEXT_DEFAULT;
  }
}

function vars(set: AccentTextSet): string {
  return ACCENT_KEYS.map((k) => (set[k] ? `${TOKEN[k]}:${set[k]};` : "")).join("");
}

/**
 * Overrides for both themes. Must be emitted after the accent CSS: the dark
 * rule shares its selector with the accent block's dark rule, so the later one
 * wins. The light rule is `:not(.dark)` so it can't leak into dark mode (a
 * bare [data-theme] rule would outrank globals.css's `.dark` block).
 */
export function accentTextCss(value: AccentText): string {
  return (["brutalist", "modern"] as const)
    .map((t) => {
      const light = vars(value[t].light);
      const dark = vars(value[t].dark);
      return (
        (light ? `html[data-theme='${t}']:not(.dark){${light}}` : "") +
        (dark ? `html[data-theme='${t}'].dark{${dark}}` : "")
      );
    })
    .join("");
}
