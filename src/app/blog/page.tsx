import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TagIcon from "@/components/blog/TagIcon";
import BlogFilters from "@/components/blog/BlogFilters";
import AnimatedPostsGrid from "@/components/blog/AnimatedPostsGrid";
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
          title: { contains: search, mode: "insensitive" },
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
    prisma.tag.findMany({
  where: { posts: { some: {} } },
  orderBy: { name: "asc" },
}),
    prisma.user.findMany({
      where: { posts: { some: { published: true } } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
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
      <header className="max-w-6xl mx-auto px-6 pt-16 pb-10 relative">
        {/* Soft ambient glow behind the headline — the one signature touch */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-[520px] h-[280px] rounded-full bg-accent/10 blur-3xl"
        />

        <div className="relative">
          <nav className="inline-flex items-center gap-2 px-4 py-2 bg-card border-[1.5px] border-border-heavy rounded-md text-xs text-muted-foreground font-medium mb-8">
            <Link href="/" className="hover:text-accent transition-colors">
              Home
            </Link>
            <span className="text-border">/</span>
            {hasFilters ? (
              <>
                <Link href="/blog" className="hover:text-accent transition-colors">
                  Blog
                </Link>
                <span className="text-border">/</span>
                <span className="text-foreground truncate max-w-[200px] md:max-w-[400px] inline-flex items-center gap-1.5">
                  {search ? (
                    `Search: ${search}`
                  ) : activeTags.length > 0 ? (
                    <>
                      <TagIcon
                        icon={activeTags[0].icon}
                        colorMode={activeTags[0].colorMode}
                        color={activeTags[0].color}
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

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.05] flex items-center gap-3 flex-wrap">
            {search
              ? `Results for "${search}"`
              : activeTags.length > 0
              ? activeTags.map((t, i) => (
                  <span key={t.id} className="inline-flex items-center gap-3">
                    <TagIcon
                      icon={t.icon}
                      colorMode={t.colorMode}
                      color={t.color}
                      className="inline-flex w-9 h-9 md:w-12 md:h-12 [&>svg]:w-full [&>svg]:h-full text-accent"
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
              : "Articles & Insights"}
          </h1>

          <BlogFilters tags={allTags} authors={authors} years={availableYears} />
        </div>
      </header>

      {/* Posts */}
      <main className="max-w-6xl mx-auto px-6 pb-24">
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