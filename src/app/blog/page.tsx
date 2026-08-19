import type { Metadata } from "next";
import BlogListing from "@/components/blog/BlogListing";

const BLOG_DESCRIPTION =
  "Reviews, launch news and buying advice on phones, laptops, smartwatches and " +
  "earbuds — sorted by newest, oldest or most read.";

// Canonical points at the bare /blog on purpose: the filter, sort and page
// params produce many URLs over the same article set, and pointing them all at
// one canonical is what stops search engines treating them as duplicates.
export const metadata: Metadata = {
  title: "Articles & Insights",
  description: BLOG_DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    url: "/blog",
    title: "Articles & Insights",
    description: BLOG_DESCRIPTION,
  },
};

/**
 * Every article, all categories. The listing itself lives in BlogListing so
 * the category pages (/news, /reviews…) render the exact same thing scoped
 * to one category — see src/app/[category]/page.tsx.
 */
export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  return <BlogListing sp={sp} basePath="/blog" />;
}
