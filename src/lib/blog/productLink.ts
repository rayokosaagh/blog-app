import { prisma } from "@/lib/prisma";

/**
 * Turns a request body's `productId` into Post write data for the "linked
 * product" field: absent leaves the link alone (partial updates), null or ""
 * unlinks, and an id links — but only to a product that exists, so a stale
 * picker can't store a dangling id the article page would then have to guess
 * about.
 */
export async function productLinkFromBody(
  body: { productId?: unknown }
): Promise<{ data: { productId?: string | null } } | { error: string }> {
  if (body.productId === undefined) return { data: {} };

  const id = typeof body.productId === "string" ? body.productId.trim() : "";
  if (!id) return { data: { productId: null } };

  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) return { error: "The linked product no longer exists" };
  return { data: { productId: id } };
}
