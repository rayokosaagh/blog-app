import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Deleting the tag automatically removes it from any posts
    // it was connected to (implicit many-to-many join table).
    await prisma.tag.delete({ where: { id } });

    return NextResponse.json({ message: "Tag deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete tag" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const icon = typeof body.icon === "string" ? body.icon : "";
    const colorMode =
  body.colorMode === "KEEP_ORIGINAL" || body.colorMode === "FORCE_MONO"
    ? body.colorMode
    : "AUTO";
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const slug = slugify(name);

    // Guard against colliding with a different tag's slug
    // (renaming "Apple" -> "apple " shouldn't clash with itself).
    const existing = await prisma.tag.findFirst({
      where: { slug, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A tag with this name already exists" },
        { status: 409 }
      );
    }

    const updated = await prisma.tag.update({
  where: { id },
  data: { name, icon, slug, colorMode },
});

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update tag" },
      { status: 500 }
    );
  }
}