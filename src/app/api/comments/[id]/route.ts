import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const isOwner = comment.authorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Not allowed to delete this comment" },
        { status: 403 }
      );
    }

    // Replies cascade-delete automatically (schema: Comment.parentId onDelete Cascade)
    await prisma.comment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete comment:", err);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}