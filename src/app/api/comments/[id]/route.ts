import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const STAFF_ROLES = new Set(["ADMIN", "EDITOR"]);

// A signed-in reader reports a comment. One report is enough to pull it out
// of the public thread immediately (status -> PENDING) so a live problem
// doesn't sit visible while waiting on a moderator to notice it; staff then
// approve (restore) or reject it from the dashboard queue. Trade-off: a
// single bad-faith report can also hide a legitimate comment until a
// moderator reviews it — acceptable given comments already require login,
// but worth revisiting with a report-count threshold if it gets abused.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "You must be signed in to report a comment" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.authorId === session.user.id) {
      return NextResponse.json({ error: "You can't report your own comment" }, { status: 400 });
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: { status: "PENDING" },
    });

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (err) {
    console.error("Failed to report comment:", err);
    return NextResponse.json({ error: "Failed to report comment" }, { status: 500 });
  }
}

// Staff-only: move a comment between moderation states.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !STAFF_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { status } = body as { status?: string };

    if (!status || !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: { status: status as "PENDING" | "APPROVED" | "REJECTED" },
    });

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (err) {
    console.error("Failed to update comment status:", err);
    return NextResponse.json({ error: "Failed to update comment status" }, { status: 500 });
  }
}

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
    const isStaff = STAFF_ROLES.has(session.user.role);

    if (!isOwner && !isStaff) {
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