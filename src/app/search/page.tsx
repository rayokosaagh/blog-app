import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SearchEmptyState from "@/components/blog/SearchEmptyState";
import SearchResultsGrid from "@/components/blog/SearchResultsGrid";
import Pagination from "@/components/blog/Pagination";

const PAGE_SIZE = 12;

// Result pages are thin, endlessly variable and worthless in an index, so this
// is the one public route that asks not to be indexed. Links are still
// followed, so anything reachable only via search still gets crawled.
export const metadata: Metadata = {
  title: "Search",
  description: "Search articles, reviews and gadgets.",
  robots: { index: false, follow: true },
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim() ?? "";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  // Searches title, body content, tag names, and author name — not just the
  // headline — so a reader who half-remembers a post can still find it.
  const where =
    query.length >= 2
      ? {
          published: true,
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { content: { contains: query, mode: "insensitive" as const } },
            { author: { name: { contains: query, mode: "insensitive" as const } } },
            { tags: { some: { name: { contains: query, mode: "insensitive" as const } } } },
          ],
        }
      : null;

  const [posts, totalCount] = where
    ? await Promise.all([
        prisma.post.findMany({
          where,
          select: {
            id: true,
            title: true,
            slug: true,
            featuredImage: true,
            createdAt: true,
            category: true,
            author: {
              select: { name: true },
            },
          },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          orderBy: { createdAt: "desc" },
        }),
        prisma.post.count({ where }),
      ])
    : [[], 0];

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <header className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <nav className="inline-flex items-center gap-2 px-4 py-2 bg-card border-2 border-border-heavy rounded-none text-xs text-muted-foreground font-bold shadow-brutal-sm mb-8">
          <Link href="/" className="brutal-invert px-1 -mx-1">
            Home
          </Link>
          <span className="text-border">/</span>
          <Link href="/blog" className="brutal-invert px-1 -mx-1">
            Blog
          </Link>
          <span className="text-border">/</span>
          <span className="text-foreground font-bold truncate max-w-[200px] md:max-w-[400px]">
            {query ? `Search: ${query}` : "Search"}
          </span>
        </nav>

        <h1 className="h-display text-foreground">
          {query ? `Results for "${query}"` : "Search"}
        </h1>

        <p className="mt-4 text-sm text-muted-foreground">
          {query
            ? `${totalCount} result${totalCount !== 1 ? "s" : ""} found`
            : "Type at least 2 characters to search."}
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-24">
        {posts.length === 0 ? (
          <SearchEmptyState query={query} />
        ) : (
          <>
            <SearchResultsGrid posts={posts} filterKey={`${query}-${page}`} />
            <Pagination basePath="/search" currentPage={page} totalPages={totalPages} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}