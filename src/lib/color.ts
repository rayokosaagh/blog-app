// Small, dependency-free colour helpers used to turn the admin-chosen accent
// hexes into a full, theme-consistent token set (contrast text, tints, and
// lightened dark-mode variants) — so the dashboard only needs to expose a
// couple of colour pickers, not a dozen.

export type RGB = { r: number; g: number; b: number };

const WHITE: RGB = { r: 255, g: 255, b: 255 };
const BLACK: RGB = { r: 0, g: 0, b: 0 };
// Near-black used as the "dark text" option — a hair warm so it never looks
// like a hard pure-black on coloured fills.
const INK: RGB = { r: 20, g: 16, b: 30 };

export function isValidHex(hex: string): boolean {
  return /^#?[0-9a-fA-F]{6}$/.test(hex.trim());
}

export function hexToRgb(hex: string): RGB | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const c = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Normalise any accepted hex (with/without #, any case) to `#rrggbb`. */
export function normalizeHex(hex: string, fallback = "#000000"): string {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHex(rgb) : fallback;
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

/** Blend a colour toward white by `t` (0–1). */
export function lighten(hex: string, t: number): string {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHex(mix(rgb, WHITE, t)) : hex;
}

/** Blend a colour toward black by `t` (0–1). */
export function darken(hex: string, t: number): string {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHex(mix(rgb, BLACK, t)) : hex;
}

/** Blend `a` toward `b` by `t` (0–1). */
export function mixHex(a: string, b: string, t: number): string {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  return ra && rb ? rgbToHex(mix(ra, rb, t)) : a;
}

// WCAG relative luminance.
function relLuminance({ r, g, b }: RGB): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: RGB, b: RGB): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Minimum contrast white text must clear before we fall back to dark ink. 3.0
// is the WCAG AA threshold for large/bold text, which is what these accent
// fills always carry — bold uppercase button labels, badges and pills.
//
// Picking "whichever of white/ink contrasts more" (the obvious rule) flips to
// black at a relative luminance around 0.18, which sends ordinary mid-tone
// brand colours — a #3b82f6 blue, a #db2777 pink — to black text. On a
// saturated fill that reads as a mismatch, not as a contrast decision.
// Preferring white until it genuinely becomes hard to read means only actually
// light fills (yellows, cyans, pale tints) get dark text.
//
// Below this threshold dark ink is always comfortably readable: if white
// contrast < 3, the fill's luminance is > 0.30, which puts black above 7:1.
const MIN_WHITE_CONTRAST = 3;

/**
 * Readable text colour (white or a dark ink) to sit on top of `hex`.
 *
 * `ink` defaults to a slightly warm near-black, which keeps coloured fills from
 * looking harsh — but brutalist passes pure `#000000`, since hard black is part
 * of that theme's identity.
 */
export function onColor(hex: string, ink: RGB = INK): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#ffffff";
  return contrast(rgb, WHITE) >= MIN_WHITE_CONTRAST ? "#ffffff" : rgbToHex(ink);
}

export type AccentTrio = { accent: string; accent2: string; accent3: string };
export type TokenSet = Record<string, string>;

/** A theme's accents for both colour schemes. */
export type ThemeAccents = { light: AccentTrio; dark: AccentTrio };

// Palette defaults, mirroring what's baked into globals.css. They live here
// rather than in settings.ts because this module is dependency-free — the
// dashboard's client-side colour picker can import them without dragging the
// server-only settings module (and Prisma with it) into the browser bundle.
// accent3 is deliberately the lightest step of the ramp, but it still has to
// carry text: it fills the small uppercase badges (category chips, the ad-rail
// eyebrow) that render at 9–12px, so it needs 4.5:1, not the 3:1 large-text
// bar. The previous #8b5cf6 could not reach that against *any* text colour —
// white 4.23:1, the warm ink 4.42:1, pure black only 4.96:1 — so the fill
// itself is a step darker here. #8055e2 gives white 4.87:1 while staying
// lighter than accent2 (5.70:1), which keeps the ramp reading in order.
export const MODERN_ACCENTS_DEFAULT: AccentTrio = {
  accent: "#5b21b6",
  accent2: "#7c3aed",
  accent3: "#8055e2",
};

// Brutalist keeps two independent trios: its light palette is primary-bright
// (blue / yellow / pink) while dark is neon-on-charcoal (lime / cyan /
// magenta). They're deliberately different hue families, so — unlike modern —
// dark is NOT derived by lightening light; that would flatten the neons into
// pastels and lose the theme's character.
export const BRUTALIST_LIGHT_DEFAULT: AccentTrio = {
  accent: "#2563eb",
  accent2: "#ffe500",
  accent3: "#db2777",
};
export const BRUTALIST_DARK_DEFAULT: AccentTrio = {
  accent: "#c6ff33",
  accent2: "#22d3ee",
  accent3: "#ff2ec4",
};

/** Clamp a (possibly partial/invalid) trio to normalised hexes. */
export function normalizeTrio(trio: AccentTrio, fallback: AccentTrio): AccentTrio {
  return {
    accent: normalizeHex(trio.accent, fallback.accent),
    accent2: normalizeHex(trio.accent2, fallback.accent2),
    accent3: normalizeHex(trio.accent3, fallback.accent3),
  };
}

/** The token set for one trio, with contrast text derived per colour. */
function accentVars(trio: AccentTrio, tint: string, ink?: RGB): TokenSet {
  return {
    "--accent": trio.accent,
    "--accent-2": trio.accent2,
    "--accent-3": trio.accent3,
    "--on-accent": onColor(trio.accent, ink),
    "--on-accent-2": onColor(trio.accent2, ink),
    "--on-accent-3": onColor(trio.accent3, ink),
    "--accent-tint": tint,
  };
}

/**
 * Modern's default dark palette: the light accents lightened so they stay
 * vivid against the near-black background. This is what you get when the
 * admin hasn't overridden dark mode explicitly.
 */
export function deriveModernDark(light: AccentTrio): AccentTrio {
  return {
    accent: lighten(light.accent, 0.4),
    accent2: lighten(light.accent2, 0.4),
    accent3: lighten(light.accent3, 0.45),
  };
}

/**
 * Turn the chosen accents into the full modern-theme token sets for light and
 * dark mode, with contrast text derived per colour.
 *
 * `darkOverride` is the admin's hand-picked dark palette. Passing null (the
 * default) keeps dark derived from light, so changing the light accent keeps
 * updating both — which is the behaviour worth preserving for anyone who
 * doesn't want to manage two palettes.
 */
export function buildModernAccentVars(
  trio: AccentTrio,
  darkOverride?: AccentTrio | null,
): {
  light: TokenSet;
  dark: TokenSet;
} {
  const light = normalizeTrio(trio, MODERN_ACCENTS_DEFAULT);
  const derived = deriveModernDark(light);
  const dark = darkOverride ? normalizeTrio(darkOverride, derived) : derived;

  return {
    light: accentVars(light, lighten(light.accent, 0.9)),
    // The dark surface wash tracks whichever accent is actually on screen:
    // the source hue while dark is derived (its lightened variant is the same
    // hue), the chosen one once dark is overridden.
    dark: accentVars(dark, darken(darkOverride ? dark.accent : light.accent, 0.78)),
  };
}

/**
 * Brutalist token sets. Both schemes are taken verbatim from the admin's two
 * trios — nothing is derived across schemes (see BRUTALIST_DARK_DEFAULT).
 */
export function buildBrutalistAccentVars(accents: ThemeAccents): {
  light: TokenSet;
  dark: TokenSet;
} {
  const light = normalizeTrio(accents.light, BRUTALIST_LIGHT_DEFAULT);
  const dark = normalizeTrio(accents.dark, BRUTALIST_DARK_DEFAULT);

  return {
    // Light leaves --accent-bookmark alone: globals.css already defines it as
    // var(--accent) on :root, so it follows the new primary automatically.
    light: accentVars(light, lighten(light.accent, 0.9), BLACK),
    dark: {
      ...accentVars(dark, darken(dark.accent, 0.85), BLACK),
      // In dark, globals.css hardcodes the bookmark accent to the same magenta
      // as accent-3. Re-point it at the chosen tertiary so that relationship
      // survives a palette change.
      "--accent-bookmark": dark.accent3,
      "--on-accent-bookmark": onColor(dark.accent3, BLACK),
    },
  };
}

function serializeVars(vars: TokenSet): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

/**
 * Full CSS text overriding a theme's accent tokens for both colour schemes.
 *
 * Selectors are `html[data-theme='<theme>']` and the same plus `.dark`, which
 * outrank the `:root` and `.dark` defaults in globals.css regardless of
 * stylesheet order. Scoping to the theme attribute means each theme's
 * overrides are inert while the other theme is active, so both can be emitted
 * together.
 */
function themeAccentCss(theme: UiThemeName, sets: { light: TokenSet; dark: TokenSet }): string {
  return (
    `html[data-theme='${theme}']{${serializeVars(sets.light)}}` +
    `html[data-theme='${theme}'].dark{${serializeVars(sets.dark)}}`
  );
}

export type UiThemeName = "brutalist" | "modern";

/**
 * The dark scheme's base surfaces — the "colour of dark mode" itself, as
 * opposed to the accents that sit on top of it. Only these four are stored;
 * the rest of the dark palette (muted text, footer, heavy border) is derived
 * from them so the admin isn't asked to keep eight greys in sync by hand.
 */
export type DarkSurfaces = {
  background: string;
  card: string;
  border: string;
  foreground: string;
};

// Mirrors the .dark blocks in globals.css, so "reset" restores exactly what
// the themes shipped with.
export const BRUTALIST_DARK_SURFACES_DEFAULT: DarkSurfaces = {
  background: "#0f0f0f",
  card: "#16181d",
  border: "#2e2e2e",
  foreground: "#ffffff",
};
export const MODERN_DARK_SURFACES_DEFAULT: DarkSurfaces = {
  background: "#0a0a0c",
  card: "#131316",
  border: "#232328",
  foreground: "#ffffff",
};

export function normalizeSurfaces(s: DarkSurfaces, fallback: DarkSurfaces): DarkSurfaces {
  return {
    background: normalizeHex(s.background, fallback.background),
    card: normalizeHex(s.card, fallback.card),
    border: normalizeHex(s.border, fallback.border),
    foreground: normalizeHex(s.foreground, fallback.foreground),
  };
}

// Ratios chosen so the shipped defaults round-trip exactly: with brutalist's
// #0f0f0f/#2e2e2e/#ffffff these reproduce globals.css's #a3a3a3 muted text,
// #3f3f3f heavy outline and #393939 footer. Changing them will shift every
// site that hasn't customised its dark surfaces.
const MUTED_TEXT_RATIO = 0.6167;
const HEAVY_BORDER_LIFT = 0.0813;
const FOOTER_LIFT = 0.175;

/**
 * Expand the four chosen surfaces into the full dark token set.
 *
 * Muted text sits partway from the background toward the text colour; the
 * footer sits just above the background; and brutalist keeps a heavier outline
 * than its hairline border while modern aliases the two, exactly as
 * globals.css does.
 */
export function darkSurfaceVars(surfaces: DarkSurfaces, theme: UiThemeName): TokenSet {
  const fallback =
    theme === "modern" ? MODERN_DARK_SURFACES_DEFAULT : BRUTALIST_DARK_SURFACES_DEFAULT;
  const { background, card, border, foreground } = normalizeSurfaces(surfaces, fallback);

  return {
    "--background": background,
    "--card": card,
    "--muted": card,
    "--border": border,
    "--border-heavy": theme === "modern" ? border : lighten(border, HEAVY_BORDER_LIFT),
    "--foreground": foreground,
    "--muted-foreground": mixHex(background, foreground, MUTED_TEXT_RATIO),
    "--footer-bg": theme === "modern" ? card : lighten(background, FOOTER_LIFT),
  };
}

/**
 * Dark-surface overrides for one theme. Emitted as its own rule rather than
 * merged into the accent block — the two sets never touch the same custom
 * property, so keeping them separate avoids threading surfaces through every
 * accent builder.
 */
export function darkSurfaceCss(theme: UiThemeName, surfaces: DarkSurfaces): string {
  return `html[data-theme='${theme}'].dark{${serializeVars(darkSurfaceVars(surfaces, theme))}}`;
}

export function modernAccentCss(trio: AccentTrio, darkOverride?: AccentTrio | null): string {
  return themeAccentCss("modern", buildModernAccentVars(trio, darkOverride));
}

export function brutalistAccentCss(accents: ThemeAccents): string {
  return themeAccentCss("brutalist", buildBrutalistAccentVars(accents));
}
