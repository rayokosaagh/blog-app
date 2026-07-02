import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;

  const posts = await prisma.post.findMany({
  where: {
    published: true,
    ...(search && {
      title: { contains: search, mode: "insensitive" },
    }),
  },
  orderBy: { createdAt: "desc" },
  include: { author: true },
});
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 pt-12 pb-8">

        <div className="mb-6">
          <nav className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-card border border-border rounded-full text-sm text-muted-foreground font-medium shadow-sm dark:shadow-none">
            <Link href="/" className="hover:text-accent transition-colors">
              Home
            </Link>
            <span className="text-border text-xs">/</span>

            {search ? (
              <>
                <Link href="/blog" className="hover:text-accent transition-colors">
                  Blog
                </Link>
                <span className="text-border text-xs">/</span>
                <span className="text-foreground truncate max-w-[200px] md:max-w-[400px]">
                  Search: {search}
                </span>
              </>
            ) : (
              <span className="text-foreground">Blog</span>
            )}
          </nav>
        </div>

        <h1 className="text-4xl font-bold text-foreground">
          {search ? `Results for "${search}"` : "Blog"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {posts.length} {posts.length === 1 ? "post" : "posts"}{" "}
          {search ? "found" : "published"}
        </p>
      </header>

      {/* Posts */}
      <main className="max-w-6xl mx-auto px-6 pb-20">
        {posts.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-16 text-center shadow-sm dark:shadow-none">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-foreground text-lg font-medium mb-6">
              {search ? `No posts found for "${search}"` : "No posts yet"}
            </p>
            {search && (
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground/5 hover:bg-foreground/10 rounded-full text-muted-foreground hover:text-foreground font-medium text-sm transition-colors group"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span> View all posts
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-card rounded-2xl overflow-hidden hover:shadow-xl dark:hover:shadow-none transition-all duration-300 flex flex-col border border-border"
              >
                {/* Image */}
                <div className="overflow-hidden">
                  {post.featuredImage ? (
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-52 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/40 dark:to-indigo-800/30 flex items-center justify-center">
                      <span className="text-5xl">📝</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  {/* Category tag */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-accent text-xs font-semibold uppercase tracking-wide">
                      Blog
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                  </div>

                  {/* Title */}
                  <h2 className="text-base font-bold text-foreground group-hover:text-accent transition-colors leading-snug mb-3 line-clamp-3">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                    {post.content.replace(/<[^>]*>/g, "").substring(0, 120)}...
                  </p>

                  {/* Author + date */}
                  <div className="mt-auto flex items-center gap-2 pt-4 border-t border-border">
                    {post.author.image ? (
  <img
    src={post.author.image}
    alt={post.author.name ?? "Author"}
    className="w-7 h-7 rounded-full object-cover shrink-0"
  />
) : (
  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs shrink-0">
    {post.author.name?.charAt(0).toUpperCase()}
  </div>
)}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-0">
                      <span className="font-medium text-foreground/80 truncate">
                        {post.author.name}
                      </span>
                      <span className="mx-1 shrink-0">·</span>
                      <time className="shrink-0">{formatDate(post.createdAt)}</time>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}