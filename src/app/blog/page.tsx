import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TagIcon from "@/components/TagIcon";
import BlogFilters from "@/components/BlogFilters";
import AnimatedPostsGrid from "@/components/AnimatedPostsGrid";
import type { Prisma } from "@/generated/prisma";

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    tag?: string;
    author?: string;
    month?: string;
    year?: string;
  }>;
}) {
  const { search, tag, author, month, year } = await searchParams;
  const tagSlugs = tag ? tag.split(",").filter(Boolean) : [];

  const monthNum = month ? parseInt(month, 10) : undefined;
  const yearNum = year ? parseInt(year, 10) : undefined;
  const hasValidMonth =
    monthNum !== undefined && !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12;
  const hasValidYear = yearNum !== undefined && !isNaN(yearNum);

  // month + year, or year alone -> a plain gte/lt range Prisma can filter directly.
  // month alone (no year) can't be a single range since it repeats every year,
  // so that case falls through to a raw SQL EXTRACT(MONTH ...) filter below.
  let createdAtFilter: Prisma.DateTimeFilter | undefined;
  if (hasValidYear && hasValidMonth) {
    createdAtFilter = {
      gte: new Date(Date.UTC(yearNum!, monthNum! - 1, 1)),
      lt: new Date(Date.UTC(yearNum!, monthNum!, 1)),
    };
  } else if (hasValidYear) {
    createdAtFilter = {
      gte: new Date(Date.UTC(yearNum!, 0, 1)),
      lt: new Date(Date.UTC(yearNum! + 1, 0, 1)),
    };
  }

  const monthOnly = hasValidMonth && !hasValidYear;

  const hasFilters = Boolean(search || tagSlugs.length > 0 || author || month || year);

  // If filtering by month-only, first grab matching post IDs via raw SQL,
  // then constrain the main findMany with an `id: { in: ... }` filter.
  let monthOnlyIds: string[] | undefined;
  if (monthOnly) {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Post"
      WHERE EXTRACT(MONTH FROM "createdAt") = ${monthNum}
    `;
    monthOnlyIds = rows.map((r) => r.id);
  }

  const [posts, activeTags, allTags, authors, availableYearsRaw] = await Promise.all([
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
        ...(monthOnlyIds && { id: { in: monthOnlyIds } }),
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
    // Distinct years that have at least one published post, newest first.
    prisma.$queryRaw<{ year: number }[]>`
      SELECT DISTINCT EXTRACT(YEAR FROM "createdAt")::int AS year
      FROM "Post"
      WHERE published = true
      ORDER BY year DESC
    `,
  ]);

  const activeAuthor = author ? authors.find((a) => a.id === author) : null;
  const availableYears =
    availableYearsRaw.length > 0
      ? availableYearsRaw.map((r) => r.year)
      : [new Date().getFullYear()];

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
                  {search ? (
                    `Search: ${search}`
                  ) : activeTags.length > 0 ? (
                    <>
                      <TagIcon
                        icon={activeTags[0].icon}
                        className="inline-flex w-3.5 h-3.5 [&>svg]:w-full [&>svg]:h-full"
                      />
                      {activeTags.length === 1
                        ? activeTags[0].name
                        : `${activeTags[0].name} +${activeTags.length - 1}`}
                    </>
                  ) : activeAuthor ? (
                    `By ${activeAuthor.name}`
                  ) : month || year ? (
                    "Filtered by date"
                  ) : (
                    "Filtered"
                  )}
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
                  <TagIcon
                    icon={t.icon}
                    className="inline-flex w-8 h-8 [&>svg]:w-full [&>svg]:h-full"
                  />
                  {t.name}
                  {i < activeTags.length - 1 && (
                    <span className="text-muted-foreground text-2xl font-normal">
                      +
                    </span>
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
        <BlogFilters tags={allTags} authors={authors} years={availableYears} />
      </header>

      {/* Posts */}
      <main className="max-w-6xl mx-auto px-6 pb-20">
        <AnimatedPostsGrid
          posts={posts}
          hasFilters={hasFilters}
          filterKey={`${search ?? ""}-${tag ?? ""}-${author ?? ""}-${month ?? ""}-${year ?? ""}`}
        />
      </main>

      <Footer />
    </div>
  );
}