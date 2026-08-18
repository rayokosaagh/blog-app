// src/app/api/gadgets/compare/route.ts
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { lookupEditorVerdicts } from "@/lib/gadgets/editorVerdicts";

// Hard ceiling just to stop someone from passing p1..p999 in the query string.
// Bump this if you ever add a category with more compare slots than this.
const MAX_COMPARE_SLOTS = 8;

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

  // Read pN params dynamically instead of hardcoding p1/p2/p3, so this
  // works for any category's maxCompare, not just categories with <= 3 slots.
  const slugs: string[] = [];
  for (let i = 1; i <= MAX_COMPARE_SLOTS; i++) {
    const slug = searchParams.get(`p${i}`);
    if (slug) slugs.push(slug);
  }

  // CHANGED: only require >=1 slug here, not >=2. The client is the one
  // filling slots one at a time (handlePick sends whatever is currently
  // filled + the new pick), so a request can legitimately have just 1
  // slug — e.g. picking the very first product into an empty comparison,
  // or re-adding a product after removing everything else. The "need at
  // least 2 to show a comparison" rule is a UI concern (already enforced
  // client-side via `filledProducts.length >= 2`), not an API concern.
  // Rejecting single-product requests here caused picks to silently no-op:
  // the client only applies the response when res.ok, so a 400 here meant
  // the picked product was thrown away with no error shown to the user.
  if (!category || slugs.length < 1) {
    return Response.json({ error: "category and at least 1 product required" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, category: { slug: category } },
  });

  const foundSlugs = new Set(products.map((p) => p.slug));
  const missingSlugs = slugs.filter((s) => !foundSlugs.has(s));

  // Instead of failing the whole request when one slug doesn't resolve
  // (wrong category, stale slug, race with a remove elsewhere), return
  // whatever DID resolve plus which ones didn't. The client can then
  // update the slots it successfully got instead of throwing away
  // everything, and optionally surface which pick failed.
  const ordered = slugs
    .map((s) => products.find((p) => p.slug === s))
    .filter(Boolean);

  // CHANGED: only error out if NOTHING resolved at all. Previously this
  // required >=2 resolved products, which meant picking a single valid
  // product (with no other slots filled) still 400'd even though the
  // product itself was found just fine.
  if (ordered.length < 1) {
    return Response.json(
      {
        error: "None of the requested products could be found in this category",
        missingSlugs,
      },
      { status: 400 }
    );
  }

  return Response.json({
    products: ordered,
    editorVerdicts: await lookupEditorVerdicts(ordered.map((p) => p!.slug)),
    ...(missingSlugs.length > 0 ? { missingSlugs } : {}),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

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