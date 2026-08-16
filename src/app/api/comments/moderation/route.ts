import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const STAFF_ROLES = new Set(["ADMIN", "EDITOR"]);

// Flat (non-threaded) list of every comment across every post, for the
// dashboard moderation queue. Separate from the public GET on /api/comments,
// which is scoped to one post and only ever returns APPROVED comments.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !STAFF_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const validStatus = status && ["PENDING", "APPROVED", "REJECTED"].includes(status) ? status : null;

  try {
    const comments = await prisma.comment.findMany({
      where: validStatus ? { status: validStatus as "PENDING" | "APPROVED" | "REJECTED" } : {},
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, email: true, image: true, role: true } },
        post: { select: { id: true, title: true, slug: true } },
      },
      take: 500,
    });

    return NextResponse.json({ comments });
  } catch (err) {
    console.error("Failed to fetch comments for moderation:", err);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}
