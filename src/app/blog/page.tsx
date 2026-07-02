import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TagIcon from "@/components/TagIcon";
import BlogFilters from "@/components/BlogFilters";
import { sortTagsByOrder } from "@/lib/sortTags";
import type { Prisma } from "@/generated/prisma";

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
  searchParams: Promise<{
    search?: string;
    tag?: string;
    author?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const { search, tag, author, dateFrom, dateTo } = await searchParams;
  const tagSlugs = tag ? tag.split(",").filter(Boolean) : [];

  // Build the createdAt range filter. `dateTo` is inclusive of the whole day.
  let createdAtFilter: Prisma.DateTimeFilter | undefined;
  const gte = dateFrom ? new Date(dateFrom) : undefined;
  const lte = dateTo ? new Date(`${dateTo}T23:59:59.999`) : undefined;
  if (gte || lte) {
    createdAtFilter = {
      ...(gte && !isNaN(gte.getTime()) ? { gte } : {}),
      ...(lte && !isNaN(lte.getTime()) ? { lte } : {}),
    };
  }

  const hasFilters = Boolean(search || tagSlugs.length > 0 || author || dateFrom || dateTo);

  const [posts, activeTags, allTags, authors] = await Promise.all([
    prisma.post.findMany({
      where: {
        published: true,
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(tagSlugs.length > 0 && {
          AND: tagSlugs.map((slug) => ({
            tags: { some: { slug } },
          })),
        }),
        ...(author && { authorId: author }),
        ...(createdAtFilter && { createdAt: createdAtFilter }),
      },
      orderBy: { createdAt: "desc" },
      include: { author: true, tags: true },
    }),
    tagSlugs.length > 0
      ? prisma.tag.findMany({ where: { slug: { in: tagSlugs } } })
      : Promise.resolve([]),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { posts: { some: { published: true } } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const activeAuthor = author ? authors.find((a) => a.id === author) : null;

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

            {hasFilters ? (
              <>
                <Link href="/blog" className="hover:text-accent transition-colors">
                  Blog
                </Link>
                <span className="text-border text-xs">/</span>
                <span className="text-foreground truncate max-w-[200px] md:max-w-[400px] inline-flex items-center gap-1.5">
                  {search
                    ? `Search: ${search}`
                    : activeTags.length > 0
                    ? (
                      <>
                        <TagIcon icon={activeTags[0].icon} className="inline-flex w-3.5 h-3.5 [&>svg]:w-full [&>svg]:h-full" />
                        {activeTags.length === 1
                          ? activeTags[0].name
                          : `${activeTags[0].name} +${activeTags.length - 1}`}
                      </>
                    )
                    : activeAuthor
                    ? `By ${activeAuthor.name}`
                    : "Filtered"}
                </span>
              </>
            ) : (
              <span className="text-foreground">Blog</span>
            )}
          </nav>
        </div>

        <h1 className="text-4xl font-bold text-foreground flex items-center gap-2.5 flex-wrap">
          {search
            ? `Results for "${search}"`
            : activeTags.length > 0
            ? activeTags.map((t, i) => (
                <span key={t.id} className="inline-flex items-center gap-2.5">
                  <TagIcon icon={t.icon} className="inline-flex w-8 h-8 [&>svg]:w-full [&>svg]:h-full" />
                  {t.name}
                  {i < activeTags.length - 1 && (
                    <span className="text-muted-foreground text-2xl font-normal">+</span>
                  )}
                </span>
              ))
            : activeAuthor
            ? `Posts by ${activeAuthor.name}`
            : "Blog"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {posts.length} {posts.length === 1 ? "post" : "posts"}{" "}
          {hasFilters ? "found" : "published"}
        </p>

        {/* Advanced filters */}
        <BlogFilters tags={allTags} authors={authors} />
      </header>

      {/* Posts */}
      <main className="max-w-6xl mx-auto px-6 pb-20">
        {posts.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-16 text-center shadow-sm dark:shadow-none">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-foreground text-lg font-medium mb-6">
              {hasFilters ? "No posts match these filters" : "No posts yet"}
            </p>
            {hasFilters && (
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
            {posts.map((post) => {
              const orderedTags = sortTagsByOrder(post.tags, post.tagOrder);
              return (
              <div
                key={post.id}
                className="group bg-card rounded-2xl overflow-hidden hover:shadow-xl dark:hover:shadow-none transition-all duration-300 flex flex-col border border-border"
              >
                <Link href={`/blog/${post.slug}`} className="block">
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
                </Link>

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
                  <Link href={`/blog/${post.slug}`} className="block">
                    <h2 className="text-base font-bold text-foreground group-hover:text-accent transition-colors leading-snug mb-3 line-clamp-3">
                      {post.title}
                    </h2>
                  </Link>

                  {/* Excerpt */}
                  <Link href={`/blog/${post.slug}`} className="block">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                      {post.content.replace(/<[^>]*>/g, "").substring(0, 120)}...
                    </p>
                  </Link>

                  {/* Tags */}
                  {orderedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {orderedTags.slice(0, 3).map((t) => (
                        <Link
                          key={t.id}
                          href={`/blog?tag=${t.slug}`}
                          className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          <TagIcon
                            icon={t.icon}
                            className="inline-flex w-3.5 h-3.5 [&>svg]:w-full [&>svg]:h-full"
                          />
                          <span>{t.name}</span>
                        </Link>
                      ))}
                      {orderedTags.length > 3 && (
                        <span className="inline-flex items-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-medium px-2 py-0.5 rounded-full">
                          +{orderedTags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Author + date */}
                  <Link href={`/blog/${post.slug}`} className="mt-auto flex items-center gap-2 pt-4 border-t border-border">
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
                  </Link>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}