// src/app/api/gadgets/compare/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const featured = searchParams.get("featured");

  // ── Curated list (admin page + homepage cards) ──
  if (featured === "true") {
    const comparisons = await prisma.comparison.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true, productA: true, productB: true },
    });
    return Response.json({ comparisons });
  }

  // ── Live pair lookup (comparison table widget) ──
  const category = searchParams.get("category");
  const slugs = [searchParams.get("p1"), searchParams.get("p2"), searchParams.get("p3")].filter(Boolean) as string[];

  if (!category || slugs.length < 2) {
    return Response.json({ error: "category and at least 2 products required" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, category: { slug: category } },
  });

  if (products.length !== slugs.length) {
    return Response.json({ error: "One or more products aren't in this category" }, { status: 400 });
  }

  const ordered = slugs.map((s) => products.find((p) => p.slug === s)!);

  return Response.json({ products: ordered });
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
  if (productA.categoryId !== productB.categoryId) {
    return Response.json({ error: "Both products must be in the same category" }, { status: 400 });
  }

  const comparison = await prisma.comparison.create({
    data: { categoryId: productA.categoryId, productAId, productBId },
    include: { category: true, productA: true, productB: true },
  });

  return Response.json({ comparison }, { status: 201 });
}