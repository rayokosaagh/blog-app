import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TagIcon from "@/components/blog/TagIcon";
import BlogFilters from "@/components/blog/BlogFilters";
import AnimatedPostsGrid from "@/components/blog/AnimatedPostsGrid";
import Pagination from "@/components/blog/Pagination";
import BlogSort from "@/components/blog/BlogSort";
import CategoryTabs from "@/components/blog/CategoryTabs";
import { parseSort } from "@/lib/blogSort";
import type { PostCategoryDef } from "@/lib/blog/categories";
import type { Prisma } from "@/generated/prisma";

const PAGE_SIZE = 12;

type SearchParams = { [key: string]: string | string[] | undefined };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * The article listing — header, category tabs, filters, sort, grid, pager.
 *
 * Rendered by /blog (every category, `category` undefined) and by each
 * category landing page (/news, /reviews…), the same way ProductListing is
 * shared by /products and /tag/[slug]. Filters, sort and pagination all
 * build their URLs on `basePath`, so a reader on /reviews who filters by
 * Samsung stays on /reviews?tag=samsung.
 */
export default async function BlogListing({
  sp,
  basePath,
  category,
}: {
  sp: SearchParams;
  /** "/blog" or "/{category slug}". */
  basePath: string;
  /** Set on a category page; scopes the query and changes the header. */
  category?: PostCategoryDef;
}) {
  const search = first(sp.search);
  const tag = first(sp.tag);
  const author = first(sp.author);
  const month = first(sp.month);
  const year = first(sp.year);
  const pageParam = first(sp.page);
  const sortParam = first(sp.sort);

  const sort = parseSort(sortParam);
  const tagSlugs = tag ? tag.split(",").filter(Boolean) : [];
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

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

  // Searches title, body content, tag names, and author name — not just the
  // headline — so "search" actually finds posts by topic, not just title.
  const postsWhere: Prisma.PostWhereInput = {
    published: true,
    ...(category && { category: category.key }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { author: { name: { contains: search, mode: "insensitive" } } },
        { tags: { some: { name: { contains: search, mode: "insensitive" } } } },
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
  };

  const totalCount = await prisma.post.count({ where: postsWhere });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);

  // `views` is indexed on Post, so "Most read" is as cheap as the date orders.
  // Ties fall back to newest-first so the ordering stays stable across pages.
  const orderBy: Prisma.PostOrderByWithRelationInput[] =
    sort === "oldest"
      ? [{ createdAt: "asc" }]
      : sort === "popular"
      ? [{ views: "desc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

  const [posts, activeTags, allTags, authors, availableYearsRaw, categoryCountRows] =
    await Promise.all([
      prisma.post.findMany({
        where: postsWhere,
        orderBy,
        include: { author: true, tags: true },
        skip: (clampedPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      tagSlugs.length > 0
        ? prisma.tag.findMany({ where: { slug: { in: tagSlugs } } })
        : Promise.resolve([]),
      // Tag pills are scoped to the category on a category page, so /guides
      // doesn't offer a "Samsung" pill that filters down to nothing.
      prisma.tag.findMany({
        where: { posts: { some: { published: true, ...(category && { category: category.key }) } } },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: { posts: { some: { published: true, ...(category && { category: category.key }) } } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.$queryRaw<{ year: number }[]>`
        SELECT DISTINCT EXTRACT(YEAR FROM "createdAt")::int AS year
        FROM "Post"
        WHERE published = true
        ORDER BY year DESC
      `,
      // Per-category counts for the tab strip. Site-wide on purpose (not
      // narrowed by the current filters) — the tabs are navigation, and the
      // number is "how much is in this section", not "how many match".
      prisma.post.groupBy({
        by: ["category"],
        where: { published: true },
        _count: { _all: true },
      }),
    ]);

  const categoryCounts = Object.fromEntries(
    categoryCountRows.map((r) => [r.category, r._count._all])
  ) as Partial<Record<string, number>>;

  const activeAuthor = author ? authors.find((a) => a.id === author) : null;
  const availableYears =
    availableYearsRaw.length > 0
      ? availableYearsRaw.map((r) => r.year)
      : [new Date().getFullYear()];

  const CategoryIcon = category?.Icon;
  const sectionLabel = category ? category.label : "Blog";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      {/* overflow-x-clip: the ambient glow below is wider than a phone viewport,
          and without this it makes the whole page pan sideways. */}
      <header className="max-w-6xl mx-auto px-6 pt-16 pb-10 relative overflow-x-clip">
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
            {category && (
              <>
                <Link href="/blog" className="hover:text-accent transition-colors">
                  Blog
                </Link>
                <span className="text-border">/</span>
              </>
            )}
            {hasFilters ? (
              <>
                <Link href={basePath} className="hover:text-accent transition-colors">
                  {sectionLabel}
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
              <span className="text-foreground">{sectionLabel}</span>
            )}
          </nav>

          <h1 className="h-display flex flex-wrap items-center gap-3 text-foreground">
            {search ? (
              `Results for "${search}"`
            ) : activeTags.length > 0 ? (
              activeTags.map((t, i) => (
                <span key={t.id} className="inline-flex items-center gap-3">
                  <TagIcon
                    icon={t.icon}
                    colorMode={t.colorMode}
                    color={t.color}
                    className="inline-flex w-9 h-9 md:w-12 md:h-12 [&>svg]:w-full [&>svg]:h-full text-accent"
                  />
                  {t.name}
                  {i < activeTags.length - 1 && (
                    <span className="text-muted-foreground text-2xl font-normal">+</span>
                  )}
                </span>
              ))
            ) : activeAuthor ? (
              `Posts by ${activeAuthor.name}`
            ) : category && CategoryIcon ? (
              <>
                <span className="inline-flex h-12 w-12 md:h-14 md:w-14 shrink-0 items-center justify-center surface-border border-border-heavy bg-accent text-on-accent shadow-brutal-sm">
                  <CategoryIcon className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2.5} />
                </span>
                {category.title}
              </>
            ) : (
              "Articles & Insights"
            )}
          </h1>
          {category && !hasFilters && (
            <p className="mt-4 max-w-2xl text-base md:text-lg text-muted-foreground">
              {category.description}
            </p>
          )}

          <CategoryTabs activeSlug={category?.slug} counts={categoryCounts} />
          <BlogFilters tags={allTags} authors={authors} years={availableYears} basePath={basePath} />
          <BlogSort total={totalCount} basePath={basePath} />
        </div>
      </header>

      {/* Posts */}
      <main className="max-w-6xl mx-auto px-6 pb-24">
        <AnimatedPostsGrid
          posts={posts}
          hasFilters={hasFilters}
          filterKey={`${category?.slug ?? "all"}-${search ?? ""}-${tag ?? ""}-${author ?? ""}-${month ?? ""}-${year ?? ""}-${sort}-${clampedPage}`}
        />
        <Pagination basePath={basePath} currentPage={clampedPage} totalPages={totalPages} />
      </main>

      <Footer />
    </div>
  );
}
