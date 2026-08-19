/**
 * Heading typography — the admin-configurable type scale.
 *
 * Headings across the site used to pick their own size: 9 distinct Tailwind
 * steps plus 18 responsive overrides, chosen per call site. That made a global
 * setting impossible, because `text-2xl` on the element always beats a custom
 * property. So headings are defined by ROLE instead — what the heading does,
 * not which tag it is — and each role reads its size/weight/tracking/case/font
 * from tokens this module emits.
 *
 * Roles are deliberately decoupled from h1-h4: heading *level* is a document
 * structure and SEO decision. A card title is an <h3> for accessibility but
 * has to be small; a sidebar widget title is also an <h3> and wants something
 * else again. Tying visual size to tag level would need exceptions immediately.
 *
 * Stored as one JSON blob per theme in the SiteSetting store (see
 * settings.ts), every field optional, so an admin only overrides what they
 * care about and the rest falls back to the defaults below.
 */

import type { UiThemeName } from "@/lib/color";

export const HEADING_ROLES = ["display", "pageTitle", "section", "card", "eyebrow"] as const;
export type HeadingRole = (typeof HEADING_ROLES)[number];

/**
 * The faces an admin can choose. All four are already declared in
 * layout.tsx, so none of them adds a new dependency — and an unused
 * next/font face is never fetched by the browser, only its @font-face rule
 * ships. "theme" means "whatever --font-sans resolves to", which is the
 * default and the only option that follows the brutalist/modern switch.
 */
export const HEADING_FONTS = ["theme", "jakarta", "grotesk", "condensed", "geist"] as const;
export type HeadingFont = (typeof HEADING_FONTS)[number];

export const HEADING_FONT_STACKS: Record<HeadingFont, string> = {
  theme: "var(--font-sans)",
  jakarta: 'var(--font-modern), "Inter", ui-sans-serif, system-ui, sans-serif',
  grotesk: '"Space Grotesk", Arial, Helvetica, sans-serif',
  condensed: 'var(--font-condensed), "Arial Narrow", Impact, sans-serif',
  geist: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
};

export const HEADING_FONT_LABELS: Record<HeadingFont, string> = {
  theme: "Theme default",
  jakarta: "Plus Jakarta Sans",
  grotesk: "Space Grotesk",
  condensed: "Bebas Neue",
  geist: "Geist",
};

/**
 * Weights each face can actually render. Bebas Neue ships a single 400, and
 * Space Grotesk is loaded at 500/700 only, so offering 200-900 for those would
 * promise steps the browser can only fake. The dashboard narrows its weight
 * control to this list.
 */
export const HEADING_FONT_WEIGHTS: Record<HeadingFont, number[]> = {
  theme: [400, 500, 600, 700, 800, 900],
  jakarta: [200, 300, 400, 500, 600, 700, 800],
  grotesk: [500, 700],
  condensed: [400],
  geist: [100, 200, 300, 400, 500, 600, 700, 800, 900],
};

export type HeadingStyle = {
  /** rem, at the small end of the viewport */
  minSize: number;
  /** rem, at the large end. Equal to minSize means "don't scale". */
  maxSize: number;
  weight: number;
  /** em */
  tracking: number;
  uppercase: boolean;
  font: HeadingFont;
};

export type HeadingType = Record<HeadingRole, HeadingStyle>;

export const HEADING_ROLE_LABELS: Record<HeadingRole, string> = {
  display: "Display",
  pageTitle: "Page title",
  section: "Section heading",
  card: "Card title",
  eyebrow: "Eyebrow / label",
};

export const HEADING_ROLE_HINTS: Record<HeadingRole, string> = {
  display: "The largest headings — page heroes and listing mastheads.",
  pageTitle: "Titles of a page or a major block within one.",
  section: "Headings that introduce a section inside a page.",
  card: "Titles on cards, feed rows and list items.",
  eyebrow: "Small uppercase labels above a heading or section.",
};

/**
 * Defaults are the values already on screen, not an idealised scale — turning
 * this system on changes nothing until an admin edits something. The
 * consistency comes from the sweep (every heading in a role now resolves to
 * ONE value) rather than from picking new numbers here.
 */
export const BRUTALIST_HEADING_DEFAULT: HeadingType = {
  // text-4xl -> md:text-6xl, font-black, tracking-tight
  display: { minSize: 2.25, maxSize: 3.75, weight: 900, tracking: -0.025, uppercase: false, font: "theme" },
  // text-2xl -> md:text-3xl
  pageTitle: { minSize: 1.5, maxSize: 1.875, weight: 800, tracking: -0.025, uppercase: false, font: "theme" },
  // text-xl -> text-2xl
  section: { minSize: 1.25, maxSize: 1.5, weight: 800, tracking: -0.015, uppercase: false, font: "theme" },
  // text-base -> text-lg
  card: { minSize: 1, maxSize: 1.125, weight: 800, tracking: -0.01, uppercase: false, font: "theme" },
  // text-xs, uppercase, tracking-[0.14em]
  eyebrow: { minSize: 0.75, maxSize: 0.75, weight: 800, tracking: 0.14, uppercase: true, font: "theme" },
};

/**
 * Modern runs a touch lighter — the theme's whole idiom is airier, and Plus
 * Jakarta Sans at 900 clamps to 800 anyway (its axis stops there), so asking
 * for black weights buys nothing.
 */
export const MODERN_HEADING_DEFAULT: HeadingType = {
  display: { minSize: 2.25, maxSize: 3.5, weight: 800, tracking: -0.03, uppercase: false, font: "theme" },
  pageTitle: { minSize: 1.5, maxSize: 1.875, weight: 700, tracking: -0.025, uppercase: false, font: "theme" },
  section: { minSize: 1.25, maxSize: 1.5, weight: 700, tracking: -0.015, uppercase: false, font: "theme" },
  card: { minSize: 1, maxSize: 1.125, weight: 700, tracking: -0.01, uppercase: false, font: "theme" },
  eyebrow: { minSize: 0.75, maxSize: 0.75, weight: 800, tracking: 0.14, uppercase: true, font: "theme" },
};

export function headingDefault(theme: UiThemeName): HeadingType {
  return theme === "modern" ? MODERN_HEADING_DEFAULT : BRUTALIST_HEADING_DEFAULT;
}

/**
 * Bounds exist so a bad value can't break the layout. They are generous
 * enough to be useful and tight enough that no setting can push a heading off
 * the page — the dashboard enforces the same numbers, but this is the copy
 * that matters, since the API is what an untrusted payload reaches.
 */
export const SIZE_MIN = 0.625; // 10px
export const SIZE_MAX = 6; // 96px
export const TRACKING_MIN = -0.1;
export const TRACKING_MAX = 0.4;

const clampNum = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * Coerce one untrusted role object against a fallback. Every field is
 * independent: an invalid weight leaves the fallback's weight in place rather
 * than discarding the whole role, matching how trioFrom() treats colours.
 */
function styleFrom(input: unknown, fallback: HeadingStyle): HeadingStyle {
  if (!input || typeof input !== "object") return fallback;
  const src = input as Record<string, unknown>;

  const minSize = isFiniteNumber(src.minSize)
    ? clampNum(src.minSize, SIZE_MIN, SIZE_MAX)
    : fallback.minSize;
  const maxSize = isFiniteNumber(src.maxSize)
    ? clampNum(src.maxSize, SIZE_MIN, SIZE_MAX)
    : fallback.maxSize;

  const font =
    typeof src.font === "string" && (HEADING_FONTS as readonly string[]).includes(src.font)
      ? (src.font as HeadingFont)
      : fallback.font;

  // A weight the chosen face can't render would be synthesised by the browser,
  // so snap to the nearest one it actually has.
  const rawWeight = isFiniteNumber(src.weight) ? src.weight : fallback.weight;
  const allowed = HEADING_FONT_WEIGHTS[font];
  const weight = allowed.reduce((best, w) =>
    Math.abs(w - rawWeight) < Math.abs(best - rawWeight) ? w : best,
  );

  return {
    // max below min would make clamp() throw the whole declaration away.
    minSize: Math.min(minSize, maxSize),
    maxSize: Math.max(minSize, maxSize),
    weight,
    tracking: isFiniteNumber(src.tracking)
      ? clampNum(src.tracking, TRACKING_MIN, TRACKING_MAX)
      : fallback.tracking,
    uppercase: typeof src.uppercase === "boolean" ? src.uppercase : fallback.uppercase,
    font,
  };
}

/** Coerce an untrusted (or absent) blob into a complete, safe HeadingType. */
export function headingTypeFrom(input: unknown, theme: UiThemeName): HeadingType {
  const fallback = headingDefault(theme);
  if (!input || typeof input !== "object") return fallback;
  const src = input as Record<string, unknown>;
  return Object.fromEntries(
    HEADING_ROLES.map((role) => [role, styleFrom(src[role], fallback[role])]),
  ) as HeadingType;
}

/** Parse the stored JSON string. Anything unreadable falls back to defaults. */
export function parseHeadingType(raw: string | null | undefined, theme: UiThemeName): HeadingType {
  if (!raw) return headingDefault(theme);
  try {
    return headingTypeFrom(JSON.parse(raw), theme);
  } catch {
    return headingDefault(theme);
  }
}

const roleVar = (role: HeadingRole) =>
  // display -> --h-display, pageTitle -> --h-page-title
  `--h-${role.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}`;

/**
 * Fluid size as a clamp(). The middle term is a line through (480px, minSize)
 * and (1280px, maxSize): at those widths 1vw is 0.3rem and 0.8rem, so the
 * slope is (max-min)/0.5 per vw and the intercept min - 0.3*slope.
 *
 * Roles whose min and max are equal emit a plain length — a clamp() with three
 * identical terms is just noise in devtools.
 */
export function sizeExpression({ minSize, maxSize }: HeadingStyle): string {
  if (minSize === maxSize) return `${minSize}rem`;
  const slope = (maxSize - minSize) / 0.5;
  const intercept = minSize - 0.3 * slope;
  return `clamp(${round(minSize)}rem, ${round(intercept)}rem + ${round(slope)}vw, ${round(maxSize)}rem)`;
}

const round = (n: number) => Math.round(n * 1000) / 1000;

function roleVars(type: HeadingType): string {
  return HEADING_ROLES.map((role) => {
    const s = type[role];
    const v = roleVar(role);
    return (
      `${v}-size:${sizeExpression(s)};` +
      `${v}-weight:${s.weight};` +
      `${v}-tracking:${round(s.tracking)}em;` +
      `${v}-case:${s.uppercase ? "uppercase" : "none"};` +
      `${v}-font:${HEADING_FONT_STACKS[s.font]};`
    );
  }).join("");
}

/**
 * Scoped to the theme's own attribute, so both themes' blocks can be emitted
 * on every page and only the active one matches — the same trick the accent
 * and dark-surface CSS uses, which keeps the theme switch a pure attribute
 * flip with no second round-trip.
 */
export function headingTypeCss(theme: UiThemeName, type: HeadingType): string {
  return `html[data-theme='${theme}']{${roleVars(type)}}`;
}
