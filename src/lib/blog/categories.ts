/**
 * Post categories — the fixed set of editorial article types.
 *
 * A category says what KIND of article a post is (news, review, versus…);
 * tags say what it is ABOUT (brand, platform, device type). Every post has
 * exactly one category and any number of tags.
 *
 * The set lives in code rather than a table because categories are
 * structural: each one is a top-level route (/news, /reviews…), a navbar
 * entry, a listing tab, an `articleSection` in structured data. Adding one is
 * a code change (enum value in prisma/schema.prisma + an entry here), which is
 * the right friction for something that changes the site's URL space.
 *
 * Only *types* are imported from the generated client — this module is used
 * by Client Components (filters, nav), and a runtime import of the Prisma
 * enum object would drag the whole client bundle in with it.
 */
import type { PostCategory } from "@/generated/prisma";
import {
  Award,
  BadgePercent,
  BookOpen,
  Newspaper,
  Scale,
  type LucideIcon,
} from "lucide-react";

export interface PostCategoryDef {
  /** The Prisma enum value stored on Post.category. */
  key: PostCategory;
  /** URL segment: /{slug} is the landing page, ?category={slug} the filter. */
  slug: string;
  /** Short label for badges, tabs and nav ("News", "Reviews"). */
  label: string;
  /** Singular noun for a single article's kicker ("Review", "Deal"). */
  singular: string;
  /** Landing-page headline. */
  title: string;
  /** One line under the headline; also the landing page's meta description. */
  description: string;
  Icon: LucideIcon;
  /**
   * Which accent token colours the badge. Kept to the three theme accents so
   * every category reads correctly in both themes and dark mode.
   */
  accent: "accent" | "accent-2" | "accent-3";
}

// Order here is display order: nav, tabs, dashboard select.
export const POST_CATEGORIES: PostCategoryDef[] = [
  {
    key: "NEWS",
    slug: "news",
    label: "News",
    singular: "News",
    title: "Tech News",
    description: "Launches, announcements, availability and what's new in gadgets.",
    Icon: Newspaper,
    accent: "accent",
  },
  {
    key: "REVIEW",
    slug: "reviews",
    label: "Reviews",
    singular: "Review",
    title: "Reviews",
    description: "Hands-on verdicts on phones, laptops, earbuds and smartwatches.",
    Icon: Award,
    accent: "accent-2",
  },
  {
    key: "VERSUS",
    slug: "versus",
    label: "Versus",
    singular: "Versus",
    title: "Versus",
    description: "Head-to-head comparisons — which one should you actually buy?",
    Icon: Scale,
    accent: "accent-3",
  },
  {
    key: "DEAL",
    slug: "deals",
    label: "Deals",
    singular: "Deal",
    title: "Deals & Prices",
    description: "Price drops, discounts and offers worth knowing about.",
    Icon: BadgePercent,
    accent: "accent-2",
  },
  {
    key: "GUIDE",
    slug: "guides",
    label: "Guides",
    singular: "Guide",
    title: "Guides",
    description: "Buying guides, explainers and how-tos.",
    Icon: BookOpen,
    accent: "accent",
  },
];

/** The category a post gets when nothing else is specified. Mirrors the Prisma default. */
export const DEFAULT_POST_CATEGORY: PostCategory = "NEWS";

const BY_KEY = new Map(POST_CATEGORIES.map((c) => [c.key, c]));
const BY_SLUG = new Map(POST_CATEGORIES.map((c) => [c.slug, c]));

/** Definition for an enum value. Every enum value has one; the fallback only guards stale data. */
export function getPostCategory(key: PostCategory | string | null | undefined): PostCategoryDef {
  return (key && BY_KEY.get(key as PostCategory)) || BY_KEY.get(DEFAULT_POST_CATEGORY)!;
}

/** Definition for a URL slug ("reviews"), or undefined if it isn't a category. */
export function getPostCategoryBySlug(slug: string | null | undefined): PostCategoryDef | undefined {
  return slug ? BY_SLUG.get(slug.toLowerCase()) : undefined;
}

/** True when `value` is one of the enum keys — use to validate API input. */
export function isPostCategory(value: unknown): value is PostCategory {
  return typeof value === "string" && BY_KEY.has(value as PostCategory);
}

/**
 * Category slugs that are also top-level routes. Anything adding a new
 * `src/app/<segment>` should check it isn't in here, and vice versa.
 */
export const POST_CATEGORY_SLUGS = POST_CATEGORIES.map((c) => c.slug);
