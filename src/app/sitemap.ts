// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/appUrl";
import { POST_CATEGORIES } from "@/lib/blog/categories";

// Re-generated hourly rather than at build time, so posts published after a
// deploy still reach the sitemap without a rebuild.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, products, tags] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tag.findMany({
      where: { posts: { some: { published: true } } },
      select: { slug: true },
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/blog`, changeFrequency: "daily", priority: 0.9 },
    // Category landing pages (/news, /reviews…) — same weight as /blog, since
    // each is a section front in its own right.
    ...POST_CATEGORIES.map((c) => ({
      url: `${APP_URL}/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    { url: `${APP_URL}/products`, changeFrequency: "daily", priority: 0.8 },
    { url: `${APP_URL}/compare`, changeFrequency: "weekly", priority: 0.6 },
  ];

  // /search is deliberately absent: it's marked noindex, and listing a
  // noindexed URL in a sitemap is a contradiction crawlers report as an error.
  return [
    ...staticRoutes,
    ...posts.map((p) => ({
      url: `${APP_URL}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${APP_URL}/product/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...tags.map((t) => ({
      url: `${APP_URL}/tag/${t.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
