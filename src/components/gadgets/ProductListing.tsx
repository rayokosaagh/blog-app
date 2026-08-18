import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LayoutGrid, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/BackToTop";
import PageHeader from "@/components/layout/PageHeader";
import TagIcon from "@/components/blog/TagIcon";
import type { TagColorMode } from "@/lib/sanitizeSvg";
import ProductGrid from "@/components/gadgets/ProductGrid";
import ProductFilterSidebar from "@/components/gadgets/ProductFilterSidebar";
import ProductCategoryTabs from "@/components/gadgets/ProductCategoryTabs";
import QuickFilterPills from "@/components/gadgets/QuickFilterPills";
import { CATEGORY_LIST } from "@/lib/gadgets/categories";
import {
  buildProductWhere,
  buildProductOrderBy,
  hasProductFilters,
  computeSpecFacets,
  productMatchesSpecFilters,
} from "@/lib/gadgets/productFilters";

type SearchParams = { [key: string]: string | string[] | undefined };

interface TagContext {
  /** Needed for the follow button; optional so existing callers keep working. */
  id?: string;
  slug: string;
  name: string;
  icon: string;
  colorMode?: TagColorMode | null;
  color?: string | null;
}

/**
 * The unified product listing — header + category tabs + filter sidebar + grid.
 * Rendered by both /products (all gadgets) and /tag/[slug] (scoped to a tag).
 * `basePath` is where filters/tabs/pills navigate (so the tag URL stays put),
 * and `tag` scopes + labels the page when present.
 */
export default async function ProductListing({
  sp,
  basePath,
  tag,
}: {
  sp: SearchParams;
  basePath: string;
  tag?: TagContext | null;
}) {
  const category = typeof sp.category === "string" ? sp.category : undefined;

  const tagScope = tag ? { tags: { some: { slug: tag.slug } } } : {};
  const catScope = category ? { category: { slug: category } } : {};

  const [productsRaw, brandRows, facetRows] = await Promise.all([
    prisma.product.findMany({
      where: buildProductWhere(sp, tagScope),
      include: { category: true },
      orderBy: buildProductOrderBy(sp),
    }),
    prisma.product.findMany({
      where: { published: true, ...tagScope, ...catScope },
      distinct: ["brand"],
      select: { brand: true },
      orderBy: { brand: "asc" },
    }),
    prisma.product.findMany({
      where: { published: true, ...tagScope, ...catScope },
      // Category comes along so computeSpecFacets can tell whether the rows in
      // scope are all one category — spec facets only make sense if they are.
      select: { specs: true, category: { select: { slug: true } } },
    }),
  ]);

  // Spec facet filters (RAM etc.) are token-aware, so apply them here rather
  // than in the DB query — this is what makes an "8/12" product match "8".
  const products = productsRaw.filter((p) => productMatchesSpecFilters(p.specs, sp));

  const brands = brandRows.map((b) => b.brand);
  const categories = CATEGORY_LIST.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon }));
  const { facets, needsCategory } = computeSpecFacets(facetRows);
  const filtered = hasProductFilters(sp);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageHeader
        crumbs={
          tag
            ? [
                { label: "Home", href: "/" },
                { label: "Gadgets", href: "/products" },
                { label: tag.name },
              ]
            : [{ label: "Home", href: "/" }, { label: filtered ? "Gadgets (filtered)" : "Gadgets" }]
        }
        title={
          tag ? (
            <>
              <TagIcon
                icon={tag.icon}
                colorMode={tag.colorMode}
                color={tag.color}
                className="inline-flex h-9 w-9 shrink-0 text-accent [&>svg]:h-full [&>svg]:w-full md:h-12 md:w-12"
              />
              {tag.name}
            </>
          ) : (
            <>
              <LayoutGrid className="h-9 w-9 text-accent md:h-12 md:w-12" />
              Gadgets in Nepal
            </>
          )
        }
        subtitle={
          `${products.length} product${products.length !== 1 ? "s" : ""}` +
          (tag ? ` tagged ${tag.name}` : filtered ? " match your filters" : "")
        }
      >
        <p className="max-w-3xl text-sm font-medium leading-relaxed text-muted-foreground">
          {tag
            ? `Browse ${tag.name} gadgets — filter by brand, price, processor and more, or use a quick pick below.`
            : "Explore, filter and compare the latest gadgets — smartphones, laptops, smartwatches and earbuds. Narrow it down by brand, price, processor and more, or jump in with a quick pick."}
        </p>

        {tag && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href="/products"
              className="brutal-press inline-flex items-center gap-2 rounded-none border-2 border-border-heavy bg-accent-3 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-on-accent-3 shadow-brutal-sm"
            >
              Tag: {tag.name}
              <X className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        <div className="mt-4">
          <QuickFilterPills basePath={basePath} />
        </div>
      </PageHeader>

      <main className="mx-auto max-w-[1600px] px-6 pb-24">
        <div className="mb-6">
          <ProductCategoryTabs categories={categories} active={category} basePath={basePath} />
        </div>

        <div className="flex flex-col items-start gap-8 lg:flex-row">
          <aside className="sticky top-20 z-20 w-full shrink-0 self-start lg:top-24 lg:w-72">
            <ProductFilterSidebar
              key={JSON.stringify(sp)}
              basePath={basePath}
              categories={categories}
              brands={brands}
              facets={facets}
              needsCategory={needsCategory}
              hideCategory
            />
          </aside>
          <div className="min-w-0 flex-1">
            <ProductGrid
              products={products}
              emptyLabel={
                tag
                  ? `No ${tag.name} products match your filters.`
                  : "No products match your filters."
              }
            />
          </div>
        </div>
      </main>

      <BackToTop />
      <Footer />
    </div>
  );
}
