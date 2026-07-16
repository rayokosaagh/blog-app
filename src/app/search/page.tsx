// src/app/search/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SearchEmptyState from "@/components/blog/SearchEmptyState";
import SearchResultsGrid from "@/components/blog/SearchResultsGrid";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const posts =
    query.length >= 2
      ? await prisma.post.findMany({
          where: {
            title: { contains: query, mode: "insensitive" },
          },
          select: {
            id: true,
            title: true,
            slug: true,
            featuredImage: true,
            createdAt: true,
            author: {
              select: { name: true },
            },
          },
          take: 30,
          orderBy: { createdAt: "desc" },
        })
      : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
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

        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground leading-[1.05]">
          {query ? `Results for "${query}"` : "Search"}
        </h1>

        <p className="mt-4 text-sm text-muted-foreground">
          {query
            ? `${posts.length} result${posts.length !== 1 ? "s" : ""} found`
            : "Type at least 2 characters to search."}
        </p>
      </header>

      {/* Results */}
      <main className="max-w-6xl mx-auto px-6 pb-24">
        {posts.length === 0 ? (
          <SearchEmptyState query={query} />
        ) : (
          <SearchResultsGrid posts={posts} filterKey={query} />
        )}
      </main>

      <Footer />
    </div>
  );
}