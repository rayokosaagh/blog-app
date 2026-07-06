import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ product });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, brand, image, priceFrom, specs, published } = body;

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(brand !== undefined && { brand }),
        ...(image !== undefined && { image }),
        ...(priceFrom !== undefined && { priceFrom: priceFrom ? Number(priceFrom) : null }),
        ...(specs !== undefined && { specs }),
        ...(published !== undefined && { published }),
      },
    });

    return Response.json({ product });
  } catch (e: any) {
    if (e.code === "P2025") {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }
    console.error("PATCH /api/gadgets/products/[id] failed:", e);
    return Response.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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