import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isSvgIcon, sanitizeSvg, resolveTagColor } from "@/lib/sanitizeSvg";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// `?hasProducts=1` returns only tags with published products.
export async function GET(req: Request) {
  try {
    const hasProducts = new URL(req.url).searchParams.get("hasProducts");
    const tags = await prisma.tag.findMany({
      where: hasProducts ? { products: { some: { published: true } } } : undefined,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(tags);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, icon, colorMode: rawColorMode, color: rawColor } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { colorMode, color } = resolveTagColor(rawColorMode, rawColor);

    const slug = slugify(name);

    let safeIcon = icon?.trim() || "🏷️";
    if (isSvgIcon(safeIcon)) {
      safeIcon = sanitizeSvg(safeIcon);
    }

    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name: name.trim(), slug, icon: safeIcon, colorMode, color },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create tag" },
      { status: 500 }
    );
  }
}