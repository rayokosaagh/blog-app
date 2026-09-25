import type { MetadataRoute } from "next";
import { getBranding } from "@/lib/settings";

// Route handlers like this one are cached at build time by default; the icon
// is admin-editable, so read it per request.
export const dynamic = "force-dynamic";

const DEFAULT_ICONS: MetadataRoute.Manifest["icons"] = [
  { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];

const ICON_TYPES: Record<string, string> = {
  png: "image/png",
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
};

/**
 * An uploaded icon replaces the bundled set. It's offered as "any" only: the
 * default maskable icon has the old artwork, and an arbitrary upload has no
 * safe-zone padding, so declaring it maskable would let Android crop it.
 */
function iconsFor(siteIcon: string | null): MetadataRoute.Manifest["icons"] {
  if (!siteIcon) return DEFAULT_ICONS;
  const ext = siteIcon.split(".").pop()?.toLowerCase() ?? "";
  return [{ src: siteIcon, sizes: "any", type: ICON_TYPES[ext] ?? "image/png", purpose: "any" }];
}

/**
 * Web app manifest — what makes the site installable to a home screen.
 *
 * `theme_color` matches the light `themeColor` in layout.tsx's viewport so the
 * installed window's title bar doesn't jump to a different colour than the
 * browser tab used. Icons are served from /icons (see public/icons); a
 * maskable variant is required or Android crops the square icon into a circle
 * and clips the artwork.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { siteIcon } = await getBranding();
  return {
    name: "Blog — tech news, gadget reviews and spec comparisons",
    short_name: "Blog",
    description:
      "Reviews, comparisons and news on the gadgets you care about, for Nepal.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["news", "technology", "shopping"],
    icons: iconsFor(siteIcon),
    shortcuts: [
      { name: "Latest articles", url: "/blog" },
      { name: "Compare gadgets", url: "/compare" },
      { name: "Your bookmarks", url: "/bookmarks" },
    ],
  };
}
