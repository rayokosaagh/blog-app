import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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