/**
 * Article typography — admin control over how a blog post's body reads.
 *
 * The site-wide heading roles (typography.ts) set every heading on the site.
 * An article's own headings borrow those roles — its H2 is 1.05 x "Page
 * title", its H3 is "Section heading" — so until now the only way to restyle
 * an article heading was to restyle every heading of that role everywhere.
 * This adds a layer on top, scoped to `.rich-text-render`:
 *
 * - Body text: font, size and line height of paragraphs and list items.
 * - Each article heading level: either FOLLOW its site role (null, the
 *   default, which is exactly today's behaviour and keeps tracking any later
 *   change to that role) or use its own full HeadingStyle.
 *
 * Nothing is emitted for a value left at its default, and the article CSS
 * falls back to its current expression for every variable, so turning this
 * system on changes nothing on screen until an admin edits something.
 *
 * Stored per theme like the heading type (settings.ts), one JSON blob each.
 */

import type { UiThemeName } from "@/lib/color";
import {
  HEADING_FONT_STACKS,
  headingDefault,
  headingStyleFrom,
  sizeExpression,
  type HeadingFont,
  type HeadingRole,
  type HeadingStyle,
  type HeadingType,
} from "@/lib/typography";

/** The four heading levels an article can contain, by what the editor calls them. */
export const ARTICLE_HEADINGS = ["kicker", "title", "sub", "minor"] as const;
export type ArticleHeading = (typeof ARTICLE_HEADINGS)[number];

export const ARTICLE_HEADING_LABELS: Record<ArticleHeading, string> = {
  kicker: "Section label",
  title: "Heading",
  sub: "Subheading",
  minor: "Minor heading",
};

export const ARTICLE_HEADING_HINTS: Record<ArticleHeading, string> = {
  kicker: "The numbered “01 · OVERVIEW” row — the editor's Section (H1) button.",
  title: "The large heading of a section — the editor's H2.",
  sub: "Numbered “1.2” subheadings — the editor's H3.",
  minor: "Small labels such as “Price in Nepal” — the editor's H4.",
};

/**
 * The site role each level follows by default, and how the article CSS
 * adjusts it: the kicker is the eyebrow a touch larger, always uppercase and
 * wider-tracked; the H2 is the page title a touch larger. Kept in step with
 * the `.rich-text-render` rules in blog/[slug]/page.tsx.
 */
export const ARTICLE_HEADING_FOLLOWS: Record<
  ArticleHeading,
  { role: HeadingRole; scale: number; tracking?: number; uppercase?: boolean }
> = {
  kicker: { role: "eyebrow", scale: 1.15, tracking: 0.18, uppercase: true },
  title: { role: "pageTitle", scale: 1.05 },
  sub: { role: "section", scale: 1 },
  minor: { role: "eyebrow", scale: 1 },
};

/**
 * What a level looks like right now when it follows its role — the starting
 * point when an admin switches it to a custom style, so the switch itself
 * changes nothing on screen.
 */
export function followedStyle(heading: ArticleHeading, siteType: HeadingType): HeadingStyle {
  const { role, scale, tracking, uppercase } = ARTICLE_HEADING_FOLLOWS[heading];
  const base = siteType[role];
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return {
    ...base,
    minSize: round(base.minSize * scale),
    maxSize: round(base.maxSize * scale),
    tracking: tracking ?? base.tracking,
    uppercase: uppercase ?? base.uppercase,
  };
}

/**
 * Body faces. Bebas Neue is left out on purpose — a single-weight condensed
 * display face is unreadable over paragraphs.
 */
export const ARTICLE_BODY_FONTS = ["theme", "jakarta", "geist", "grotesk", "serif"] as const satisfies readonly HeadingFont[];
export type ArticleBodyFont = (typeof ARTICLE_BODY_FONTS)[number];

/** The article's current values, which the fields show while left at default. */
export const BODY_SIZE_DEFAULT = 1.0625; // rem
export const BODY_LEADING_DEFAULT = 1.85;
export const BODY_SIZE_MIN = 0.875;
export const BODY_SIZE_MAX = 1.375;
export const BODY_LEADING_MIN = 1.3;
export const BODY_LEADING_MAX = 2.2;

export type ArticleBody = {
  font: ArticleBodyFont;
  /** rem; null keeps the article's own sizes (paragraphs 1.0625, list items 1). */
  size: number | null;
  /** unitless; null keeps the article's own (paragraphs 1.85, list items 1.8). */
  leading: number | null;
};

export type ArticleType = {
  body: ArticleBody;
  /** null = follow the site heading role (the default). */
  headings: Record<ArticleHeading, HeadingStyle | null>;
};

export const ARTICLE_TYPE_DEFAULT: ArticleType = {
  body: { font: "theme", size: null, leading: null },
  headings: { kicker: null, title: null, sub: null, minor: null },
};

const clampNum = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Coerce an untrusted (or absent) blob into a complete, safe ArticleType. */
export function articleTypeFrom(input: unknown, theme: UiThemeName): ArticleType {
  if (!input || typeof input !== "object") return ARTICLE_TYPE_DEFAULT;
  const src = input as Record<string, unknown>;

  const bodySrc = (src.body && typeof src.body === "object" ? src.body : {}) as Record<string, unknown>;
  const body: ArticleBody = {
    font:
      typeof bodySrc.font === "string" && (ARTICLE_BODY_FONTS as readonly string[]).includes(bodySrc.font)
        ? (bodySrc.font as ArticleBodyFont)
        : "theme",
    size: isNum(bodySrc.size) ? clampNum(bodySrc.size, BODY_SIZE_MIN, BODY_SIZE_MAX) : null,
    leading: isNum(bodySrc.leading) ? clampNum(bodySrc.leading, BODY_LEADING_MIN, BODY_LEADING_MAX) : null,
  };

  // A custom level is coerced against what it would follow, so a partial
  // object keeps sensible values for whatever it left out.
  const siteType = headingDefault(theme);
  const headSrc = (src.headings && typeof src.headings === "object" ? src.headings : {}) as Record<string, unknown>;
  const headings = Object.fromEntries(
    ARTICLE_HEADINGS.map((h) => {
      const v = headSrc[h];
      return [h, v && typeof v === "object" ? headingStyleFrom(v, followedStyle(h, siteType)) : null];
    }),
  ) as ArticleType["headings"];

  return { body, headings };
}

/** Parse the stored JSON string. Anything unreadable falls back to defaults. */
export function parseArticleType(raw: string | null | undefined, theme: UiThemeName): ArticleType {
  if (!raw) return ARTICLE_TYPE_DEFAULT;
  try {
    return articleTypeFrom(JSON.parse(raw), theme);
  } catch {
    return ARTICLE_TYPE_DEFAULT;
  }
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Custom properties for the article CSS, only for values an admin actually
 * set — every one of them has a fallback in `.rich-text-render`'s rules, so
 * an absent variable means "as before". Scoped to the theme attribute like
 * headingTypeCss, so both themes' blocks ship and only the active one matches.
 */
export function articleTypeCss(theme: UiThemeName, type: ArticleType): string {
  let vars = "";
  const { body, headings } = type;
  if (body.font !== "theme") vars += `--a-body-font:${HEADING_FONT_STACKS[body.font]};`;
  if (body.size !== null) vars += `--a-body-size:${round(body.size)}rem;`;
  if (body.leading !== null) vars += `--a-body-leading:${round(body.leading)};`;
  for (const h of ARTICLE_HEADINGS) {
    const s = headings[h];
    if (!s) continue;
    vars +=
      `--a-${h}-size:${sizeExpression(s)};` +
      `--a-${h}-weight:${s.weight};` +
      `--a-${h}-tracking:${round(s.tracking)}em;` +
      `--a-${h}-case:${s.uppercase ? "uppercase" : "none"};` +
      `--a-${h}-font:${HEADING_FONT_STACKS[s.font]};`;
  }
  return vars ? `html[data-theme='${theme}']{${vars}}` : "";
}
