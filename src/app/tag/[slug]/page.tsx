import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductListing from "@/components/gadgets/ProductListing";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await prisma.tag.findUnique({ where: { slug }, select: { name: true } });
  return { title: tag ? `${tag.name} — Gadgets` : "Tag not found" };
}

/**
 * A tag renders the unified product listing in place (same /tag/<slug> URL),
 * scoped to the tag — no redirect. Filters/tabs stay on the tag URL.
 */
export default async function TagProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const tag = await prisma.tag.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, icon: true },
  });
  if (!tag) notFound();

  return <ProductListing sp={sp} basePath={`/tag/${tag.slug}`} tag={tag} />;
}
