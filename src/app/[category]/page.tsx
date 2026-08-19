import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogListing from "@/components/blog/BlogListing";
import { POST_CATEGORIES, getPostCategoryBySlug } from "@/lib/blog/categories";

/**
 * Category landing pages: /news, /reviews, /versus, /deals, /guides.
 *
 * One dynamic segment at the root, validated against the category registry —
 * anything that isn't a category slug 404s. Static routes (/blog, /products,
 * /compare…) always win over a dynamic segment in Next, so this can't shadow
 * them; the registry's POST_CATEGORY_SLUGS is the list to check against when
 * adding a new top-level route.
 *
 * `dynamicParams = false` + generateStaticParams: only the five known slugs
 * are ever rendered; anything else 404s before the page runs. The page itself
 * is request-rendered (it reads searchParams for filters), same as /blog.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return POST_CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const def = getPostCategoryBySlug(slug);
  if (!def) return { title: "Not found" };
  // Canonical is the bare category URL — filters/sort/page params all point
  // back at it, same reasoning as /blog.
  return {
    title: def.title,
    description: def.description,
    alternates: { canonical: `/${def.slug}` },
    openGraph: { url: `/${def.slug}`, title: def.title, description: def.description },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { category: slug } = await params;
  const def = getPostCategoryBySlug(slug);
  if (!def) notFound();

  const sp = await searchParams;
  return <BlogListing sp={sp} basePath={`/${def.slug}`} category={def} />;
}
