// src/app/robots.ts
import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/appUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // These are already noindex via metadata, but blocking them here also
        // stops crawl budget being spent on pages that can never rank.
        disallow: ["/dashboard", "/dashboard/", "/account", "/bookmarks", "/api/", "/search"],
      },
    ],
    sitemap: [`${APP_URL}/sitemap.xml`, `${APP_URL}/rss.xml`],
    host: APP_URL,
  };
}
