import { prisma } from "@/lib/prisma";
import {
  parseHeadingType,
  headingTypeFrom,
  type HeadingType,
} from "@/lib/typography";
import {
  isValidHex,
  normalizeHex,
  BRUTALIST_LIGHT_DEFAULT,
  BRUTALIST_DARK_DEFAULT,
  MODERN_ACCENTS_DEFAULT,
  BRUTALIST_DARK_SURFACES_DEFAULT,
  MODERN_DARK_SURFACES_DEFAULT,
  deriveModernDark,
  type AccentTrio,
  type ThemeAccents,
  type DarkSurfaces,
} from "@/lib/color";

// Re-exported for existing importers; the values live in @/lib/color so the
// dashboard's client components can read them without pulling in Prisma.
export {
  MODERN_ACCENTS_DEFAULT,
  BRUTALIST_LIGHT_DEFAULT,
  BRUTALIST_DARK_DEFAULT,
  BRUTALIST_DARK_SURFACES_DEFAULT,
  MODERN_DARK_SURFACES_DEFAULT,
};

// Keys for the SiteSetting key/value store.
export const HOMEPAGE_ANIM_KEY = "homepageAnimatedBackground";
export const SPOTLIGHT_HEADER_KEY = "spotlightAdsHeader";
export const SPOTLIGHT_HEADER_DEFAULT = "Handpicked for you";
export const SPOTLIGHT_TITLE_KEY = "spotlightAdsTitle";
export const SPOTLIGHT_TITLE_DEFAULT = "Deals worth a look";
export const UI_THEME_KEY = "uiTheme";

// Heading typography, one JSON blob per theme. A blob rather than ~30
// individual keys per theme: the key/value store reads fine either way (it is
// one findMany), but 60 loose keys are unmanageable in the dashboard and in
// getThemeSettings' key list.
export const HEADING_TYPE_KEYS = {
  brutalist: "headingTypeBrutalist",
  modern: "headingTypeModern",
} as const;

export type UiTheme = "brutalist" | "modern";
export const UI_THEME_DEFAULT: UiTheme = "brutalist";

// Accent colours, admin-configurable from the dashboard. Only the source
// accents are stored; contrast text and tints are derived at render time (see
// src/lib/color.ts).
//
// Modern stores one trio and derives its dark scheme by lightening. Brutalist
// stores two — its light and dark palettes are different hue families by
// design — so each scheme gets its own three keys.
type TrioKeys = readonly [string, string, string];

export const MODERN_ACCENT_KEYS: TrioKeys = [
  "modernAccent",
  "modernAccent2",
  "modernAccent3",
];
export const MODERN_DARK_KEYS: TrioKeys = [
  "modernAccentDark",
  "modernAccent2Dark",
  "modernAccent3Dark",
];
// "auto" (default) derives modern's dark palette from its light one; "custom"
// uses the trio stored under MODERN_DARK_KEYS instead.
export const MODERN_DARK_MODE_KEY = "modernDarkMode";

// Dark-mode base surfaces, per theme: background, card, border, text.
type SurfaceKeys = readonly [string, string, string, string];
export const BRUTALIST_SURFACE_KEYS: SurfaceKeys = [
  "brutalistDarkBg",
  "brutalistDarkCard",
  "brutalistDarkBorder",
  "brutalistDarkText",
];
export const MODERN_SURFACE_KEYS: SurfaceKeys = [
  "modernDarkBg",
  "modernDarkCard",
  "modernDarkBorder",
  "modernDarkText",
];
export const BRUTALIST_LIGHT_KEYS: TrioKeys = [
  "brutalistAccent",
  "brutalistAccent2",
  "brutalistAccent3",
];
export const BRUTALIST_DARK_KEYS: TrioKeys = [
  "brutalistAccentDark",
  "brutalistAccent2Dark",
  "brutalistAccent3Dark",
];

// Kept as individual exports for backwards compatibility with earlier callers.
export const [MODERN_ACCENT_KEY, MODERN_ACCENT2_KEY, MODERN_ACCENT3_KEY] = MODERN_ACCENT_KEYS;

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

/** Read many settings in a single query. Missing keys are simply absent. */
export async function getSettingsMap(keys: readonly string[]): Promise<Record<string, string>> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: [...keys] } } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

/**
 * Whether the homepage animated (moving-shapes) background is enabled.
 * Defaults to ON when the setting has never been saved.
 */
export async function getHomepageAnimatedBackground(): Promise<boolean> {
  const v = await getSetting(HOMEPAGE_ANIM_KEY);
  return v === null ? true : v === "true";
}

export async function setHomepageAnimatedBackground(on: boolean): Promise<void> {
  await setSetting(HOMEPAGE_ANIM_KEY, on ? "true" : "false");
}

/** Header label shown on the homepage spotlight-ads card. */
export async function getSpotlightAdsHeader(): Promise<string> {
  const v = await getSetting(SPOTLIGHT_HEADER_KEY);
  return v && v.trim() ? v : SPOTLIGHT_HEADER_DEFAULT;
}

export async function setSpotlightAdsHeader(text: string): Promise<void> {
  await setSetting(SPOTLIGHT_HEADER_KEY, text.trim() || SPOTLIGHT_HEADER_DEFAULT);
}

/** Title/headline shown on the homepage spotlight-ads card. */
export async function getSpotlightAdsTitle(): Promise<string> {
  const v = await getSetting(SPOTLIGHT_TITLE_KEY);
  return v === null ? SPOTLIGHT_TITLE_DEFAULT : v;
}

export async function setSpotlightAdsTitle(text: string): Promise<void> {
  await setSetting(SPOTLIGHT_TITLE_KEY, text.trim());
}

/** Active site-wide UI theme ("brutalist" | "modern"). Defaults to brutalist. */
export async function getUiTheme(): Promise<UiTheme> {
  const v = await getSetting(UI_THEME_KEY);
  return v === "modern" ? "modern" : UI_THEME_DEFAULT;
}

export async function setUiTheme(theme: UiTheme): Promise<void> {
  await setSetting(UI_THEME_KEY, theme === "modern" ? "modern" : "brutalist");
}

/** Resolve one trio out of an already-fetched settings map. */
function trioFrom(
  map: Record<string, string>,
  keys: TrioKeys,
  fallback: AccentTrio,
): AccentTrio {
  const pick = (key: string, def: string) => {
    const v = map[key];
    return v && isValidHex(v) ? normalizeHex(v) : def;
  };
  return {
    accent: pick(keys[0], fallback.accent),
    accent2: pick(keys[1], fallback.accent2),
    accent3: pick(keys[2], fallback.accent3),
  };
}

/** Resolve one dark-surface set out of an already-fetched settings map. */
function surfacesFrom(
  map: Record<string, string>,
  keys: SurfaceKeys,
  fallback: DarkSurfaces,
): DarkSurfaces {
  const pick = (key: string, def: string) => {
    const v = map[key];
    return v && isValidHex(v) ? normalizeHex(v) : def;
  };
  return {
    background: pick(keys[0], fallback.background),
    card: pick(keys[1], fallback.card),
    border: pick(keys[2], fallback.border),
    foreground: pick(keys[3], fallback.foreground),
  };
}

async function setSurfaces(keys: SurfaceKeys, patch: Partial<DarkSurfaces>): Promise<void> {
  const values = [patch.background, patch.card, patch.border, patch.foreground];
  await Promise.all(
    values.flatMap((v, i) =>
      v && isValidHex(v) ? [setSetting(keys[i], normalizeHex(v))] : [],
    ),
  );
}

/** Persist a trio. Only valid `#rrggbb` values are written; the rest are left. */
async function setTrio(keys: TrioKeys, trio: Partial<AccentTrio>): Promise<void> {
  const values = [trio.accent, trio.accent2, trio.accent3];
  await Promise.all(
    values.flatMap((v, i) =>
      v && isValidHex(v) ? [setSetting(keys[i], normalizeHex(v))] : [],
    ),
  );
}

/**
 * Modern's palette. `dark` is always the *effective* dark trio — the derived
 * one while `darkAuto` is true, the stored override once it's false. Callers
 * (and the dashboard's pickers) can therefore use it directly either way, and
 * flipping auto → custom starts from exactly what was already on screen.
 */
export type ModernAccents = { light: AccentTrio; dark: AccentTrio; darkAuto: boolean };

function modernFrom(map: Record<string, string>): ModernAccents {
  const light = trioFrom(map, MODERN_ACCENT_KEYS, MODERN_ACCENTS_DEFAULT);
  const derived = deriveModernDark(light);
  const darkAuto = map[MODERN_DARK_MODE_KEY] !== "custom";
  return {
    light,
    dark: darkAuto ? derived : trioFrom(map, MODERN_DARK_KEYS, derived),
    darkAuto,
  };
}

export async function getModernAccents(): Promise<ModernAccents> {
  const map = await getSettingsMap([
    ...MODERN_ACCENT_KEYS,
    ...MODERN_DARK_KEYS,
    MODERN_DARK_MODE_KEY,
  ]);
  return modernFrom(map);
}

export async function setModernAccents(patch: {
  light?: Partial<AccentTrio>;
  dark?: Partial<AccentTrio>;
  darkAuto?: boolean;
}): Promise<void> {
  await Promise.all([
    patch.light ? setTrio(MODERN_ACCENT_KEYS, patch.light) : Promise.resolve(),
    patch.dark ? setTrio(MODERN_DARK_KEYS, patch.dark) : Promise.resolve(),
    patch.darkAuto === undefined
      ? Promise.resolve()
      : setSetting(MODERN_DARK_MODE_KEY, patch.darkAuto ? "auto" : "custom"),
  ]);
}

/** The brutalist theme's light and dark accent trios. */
export async function getBrutalistAccents(): Promise<ThemeAccents> {
  const map = await getSettingsMap([...BRUTALIST_LIGHT_KEYS, ...BRUTALIST_DARK_KEYS]);
  return {
    light: trioFrom(map, BRUTALIST_LIGHT_KEYS, BRUTALIST_LIGHT_DEFAULT),
    dark: trioFrom(map, BRUTALIST_DARK_KEYS, BRUTALIST_DARK_DEFAULT),
  };
}

/** The dark-mode base surfaces for both themes. */
export type DarkSurfacesByTheme = { brutalist: DarkSurfaces; modern: DarkSurfaces };

export async function getDarkSurfaces(): Promise<DarkSurfacesByTheme> {
  const map = await getSettingsMap([...BRUTALIST_SURFACE_KEYS, ...MODERN_SURFACE_KEYS]);
  return surfacesByThemeFrom(map);
}

function surfacesByThemeFrom(map: Record<string, string>): DarkSurfacesByTheme {
  return {
    brutalist: surfacesFrom(map, BRUTALIST_SURFACE_KEYS, BRUTALIST_DARK_SURFACES_DEFAULT),
    modern: surfacesFrom(map, MODERN_SURFACE_KEYS, MODERN_DARK_SURFACES_DEFAULT),
  };
}

export async function setDarkSurfaces(patch: {
  brutalist?: Partial<DarkSurfaces>;
  modern?: Partial<DarkSurfaces>;
}): Promise<void> {
  await Promise.all([
    patch.brutalist ? setSurfaces(BRUTALIST_SURFACE_KEYS, patch.brutalist) : Promise.resolve(),
    patch.modern ? setSurfaces(MODERN_SURFACE_KEYS, patch.modern) : Promise.resolve(),
  ]);
}

export async function setBrutalistAccents(patch: {
  light?: Partial<AccentTrio>;
  dark?: Partial<AccentTrio>;
}): Promise<void> {
  await Promise.all([
    patch.light ? setTrio(BRUTALIST_LIGHT_KEYS, patch.light) : Promise.resolve(),
    patch.dark ? setTrio(BRUTALIST_DARK_KEYS, patch.dark) : Promise.resolve(),
  ]);
}

/** Heading typography for both themes. */
export type HeadingTypeByTheme = { brutalist: HeadingType; modern: HeadingType };

function headingFrom(map: Record<string, string>): HeadingTypeByTheme {
  return {
    brutalist: parseHeadingType(map[HEADING_TYPE_KEYS.brutalist], "brutalist"),
    modern: parseHeadingType(map[HEADING_TYPE_KEYS.modern], "modern"),
  };
}

export async function getHeadingType(): Promise<HeadingTypeByTheme> {
  const map = await getSettingsMap([HEADING_TYPE_KEYS.brutalist, HEADING_TYPE_KEYS.modern]);
  return headingFrom(map);
}

/**
 * Persist one theme's heading settings. The payload is coerced through
 * headingTypeFrom first, so what lands in the row is always a complete, valid
 * blob — the read path can then trust it and never has to merge.
 */
export async function setHeadingType(theme: UiTheme, value: unknown): Promise<void> {
  await setSetting(HEADING_TYPE_KEYS[theme], JSON.stringify(headingTypeFrom(value, theme)));
}

/**
 * Everything the root layout needs to render themed HTML, in ONE query.
 * The layout runs on every page, so this deliberately avoids the
 * one-findUnique-per-key fan-out that reading these individually would cause.
 */
export async function getThemeSettings(): Promise<{
  uiTheme: UiTheme;
  modernAccents: ModernAccents;
  brutalistAccents: ThemeAccents;
  darkSurfaces: DarkSurfacesByTheme;
  headingType: HeadingTypeByTheme;
}> {
  const map = await getSettingsMap([
    UI_THEME_KEY,
    ...MODERN_ACCENT_KEYS,
    ...MODERN_DARK_KEYS,
    MODERN_DARK_MODE_KEY,
    ...BRUTALIST_LIGHT_KEYS,
    ...BRUTALIST_DARK_KEYS,
    ...BRUTALIST_SURFACE_KEYS,
    ...MODERN_SURFACE_KEYS,
    HEADING_TYPE_KEYS.brutalist,
    HEADING_TYPE_KEYS.modern,
  ]);
  return {
    uiTheme: map[UI_THEME_KEY] === "modern" ? "modern" : UI_THEME_DEFAULT,
    modernAccents: modernFrom(map),
    brutalistAccents: {
      light: trioFrom(map, BRUTALIST_LIGHT_KEYS, BRUTALIST_LIGHT_DEFAULT),
      dark: trioFrom(map, BRUTALIST_DARK_KEYS, BRUTALIST_DARK_DEFAULT),
    },
    darkSurfaces: surfacesByThemeFrom(map),
    headingType: headingFrom(map),
  };
}