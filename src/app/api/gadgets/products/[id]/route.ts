import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseColors } from "@/lib/gadgets/colors";
import { verdictFieldsFromBody } from "@/lib/verdict";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true , tags: true},
  });
  if (!product) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ product });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, brand, image, images, colors, priceFrom, specs, published, tagIds } = body;

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(brand !== undefined && { brand }),
        ...(image !== undefined && { image }),
        ...(images !== undefined && {
          images: Array.isArray(images)
            ? images.filter((u: unknown): u is string => typeof u === "string" && u.trim() !== "")
            : [],
        }),
        ...(colors !== undefined && { colors: parseColors(colors) }),
        ...(priceFrom !== undefined && { priceFrom: priceFrom ? Number(priceFrom) : null }),
        ...(specs !== undefined && { specs }),
        ...(published !== undefined && { published }),
        // Same all-or-nothing rules as posts: absent keys leave the verdict
        // untouched, a null score clears it. See verdictFieldsFromBody.
        ...verdictFieldsFromBody(body),
        ...(Array.isArray(tagIds) && {
          tags: { set: tagIds.map((tid: string) => ({ id: tid })) },
        }),
      },
      include: { tags: true },
    });

    return Response.json({ product });
  } catch (e: any) {
    if (e.code === "P2025") {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }
    console.error("PATCH /api/gadgets/products/[id] failed:", e);
    return Response.json(
      {
        error: "Failed to update product",
        // Surface the underlying reason in dev only (e.g. a stale Prisma client
        // rejecting an unknown `colors` argument after a schema change).
        ...(process.env.NODE_ENV !== "production" && { detail: e?.message }),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.product.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (e: any) {
    if (e.code === "P2025") {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }
    if (e.code === "P2003") {
      // Foreign key constraint — product is still referenced by comparisons
      const comparisonCount = await prisma.comparison.count({
        where: { OR: [{ productAId: id }, { productBId: id }] },
      });
      return Response.json(
        {
          error: `Can't delete this product — it's used in ${comparisonCount} comparison${comparisonCount === 1 ? "" : "s"}. Remove it from those comparisons first.`,
        },
        { status: 409 }
      );
    }
    console.error("DELETE /api/gadgets/products/[id] failed:", e);
    return Response.json({ error: "Failed to delete product" }, { status: 500 });
  }
}