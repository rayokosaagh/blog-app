import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  // Admin listing shows everything (active + inactive), ordered for display.
  const comparisons = await prisma.comparison.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { category: true, productA: true, productB: true },
  });
  return Response.json({ comparisons });
}

export async function POST(req: NextRequest) {
  const { productAId, productBId } = await req.json();

  if (!productAId || !productBId) {
    return Response.json({ error: "Both products are required" }, { status: 400 });
  }
  if (productAId === productBId) {
    return Response.json({ error: "Choose two different products" }, { status: 400 });
  }

  const [productA, productB] = await Promise.all([
    prisma.product.findUnique({ where: { id: productAId } }),
    prisma.product.findUnique({ where: { id: productBId } }),
  ]);

  if (!productA || !productB) {
    return Response.json({ error: "One or both products not found" }, { status: 404 });
  }

  // Enforce same-category rule server-side, not just in the UI
  if (productA.categoryId !== productB.categoryId) {
    return Response.json({ error: "Both products must be in the same category" }, { status: 400 });
  }

  // New comparisons go to the end of the current order
  const last = await prisma.comparison.aggregate({ _max: { order: true } });
  const nextOrder = (last._max.order ?? -1) + 1;

  const comparison = await prisma.comparison.create({
    data: { categoryId: productA.categoryId, productAId, productBId, order: nextOrder },
    include: { category: true, productA: true, productB: true },
  });

  return Response.json({ comparison }, { status: 201 });
}