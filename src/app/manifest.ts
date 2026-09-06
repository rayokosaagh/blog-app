import type { MetadataRoute } from "next";

/**
 * Web app manifest — what makes the site installable to a home screen.
 *
 * `theme_color` matches the light `themeColor` in layout.tsx's viewport so the
 * installed window's title bar doesn't jump to a different colour than the
 * browser tab used. Icons are served from /icons (see public/icons); a
 * maskable variant is required or Android crops the square icon into a circle
 * and clips the artwork.
 */
export default function manifest(): MetadataRoute.Manifest {
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
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Latest articles", url: "/blog" },
      { name: "Compare gadgets", url: "/compare" },
      { name: "Your bookmarks", url: "/bookmarks" },
    ],
  };
}
