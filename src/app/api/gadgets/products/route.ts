// src/app/api/gadgets/products/route.ts
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCategoryDef } from "@/lib/gadgets/categories";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const category = new URL(req.url).searchParams.get("category");
  if (!category) {
    // no category filter = return everything, used by the admin list page
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ products });
  }

 const products = await prisma.product.findMany({
  where: { category: { slug: category }, published: true },
  include: { category: true, tags: true },
  orderBy: { createdAt: "desc" },
});

  return Response.json({ products, categoryDef: getCategoryDef(category) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { slug, name, brand, image, images, priceFrom, category, specs, published, tagIds } = body;

  const gallery = Array.isArray(images)
    ? images.filter((u): u is string => typeof u === "string" && u.trim() !== "")
    : [];

  if (!slug || !name || !brand || !category) {
    return Response.json({ error: "slug, name, brand, category are required" }, { status: 400 });
  }

  const categoryDef = getCategoryDef(category);
  if (!categoryDef) {
    return Response.json({ error: `Unknown category "${category}"` }, { status: 400 });
  }

  // Ensure the category row exists in the DB (auto-sync from the code registry,
  // so admins never have to manually manage the GadgetCategory table).
  const categoryRow = await prisma.gadgetCategory.upsert({
    where: { slug: category },
    update: { name: categoryDef.name, icon: categoryDef.icon },
    create: { slug: category, name: categoryDef.name, icon: categoryDef.icon },
  });

   try {
    const product = await prisma.product.create({
      data: {
        slug,
        name,
        brand,
        image: image || null,
        images: gallery,
        priceFrom: priceFrom ? Number(priceFrom) : null,
        published: published ?? true,
        categoryId: categoryRow.id,
        specs: specs ?? {},
        ...(Array.isArray(tagIds) && tagIds.length > 0 && {
          tags: { connect: tagIds.map((id: string) => ({ id })) },
        }),
      },
      include: { tags: true },
    });
    return Response.json({ product }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return Response.json({ error: "A product with this slug already exists" }, { status: 409 });
    }
    throw e;
  }
}