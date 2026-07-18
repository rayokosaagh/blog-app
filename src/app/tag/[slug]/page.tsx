import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Tag as TagBadgeIcon } from "lucide-react";
import TagIcon from "@/components/blog/TagIcon";
import Underline from "@/components/ui/Underline";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await prisma.tag.findUnique({ where: { slug }, select: { name: true } });
  return { title: tag ? `${tag.name} — Products` : "Tag not found" };
}

export default async function TagProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tag = await prisma.tag.findUnique({
    where: { slug },
    include: {
      products: {
        where: { published: true },
        include: { category: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!tag) notFound();

  const { products } = tag;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-[1600px] mx-auto px-6 py-10">
        <div className="mb-8 pb-4 border-b-4 border-border-heavy">
          <div className="inline-flex items-center gap-2 mb-3 bg-accent text-on-accent border-2 border-border-heavy px-3 py-1 w-fit">
            <TagBadgeIcon className="w-4 h-4" />
            <span className="text-xs font-extrabold tracking-[0.14em] uppercase">
              Tag
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <TagIcon icon={tag.icon} className="inline-flex w-7 h-7 shrink-0 [&>svg]:w-full [&>svg]:h-full" />
            {tag.name}
          </h1>
          <p className="text-muted-foreground mt-1 font-bold">
            {products.length} product{products.length !== 1 ? "s" : ""} tagged{" "}
            {tag.name}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="bg-card border-2 border-border-heavy rounded-none p-12 text-center text-muted-foreground shadow-brutal">
            No products tagged {tag.name} yet.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.slug}`}
                className="brutal-press group bg-card border-2 border-border-heavy rounded-none overflow-hidden shadow-brutal-sm"
              >
                <div className="aspect-square bg-white relative overflow-hidden border-b-2 border-border-heavy">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground truncate">
                      {p.brand}
                    </p>
                    <span className="text-[9px] font-extrabold uppercase tracking-wide text-accent shrink-0">
                      {p.category.name}
                    </span>
                  </div>
                  <h4 className="text-xl font-extrabold text-foreground mt-0.5 line-clamp-2 leading-snug">
                    <Underline>{p.name}</Underline>
                  </h4>
                  {p.priceFrom != null && (
                    <p className="text-xs font-bold text-accent mt-1.5">
                      {p.currency} {p.priceFrom.toLocaleString()}
                    </p>
                  )}
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