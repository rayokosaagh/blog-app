import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

interface FlatComment {
  id: string;
  content: string;
  createdAt: Date;
  postId: string;
  parentId: string | null;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
  };
}

interface CommentNode extends FlatComment {
  replies: CommentNode[];
}

function buildTree(flat: FlatComment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  flat.forEach((c) => map.set(c.id, { ...c, replies: [] }));

  const roots: CommentNode[] = [];
  map.forEach((c) => {
    if (c.parentId) {
      const parent = map.get(c.parentId);
      if (parent) {
        parent.replies.push(c);
        return;
      }
    }
    roots.push(c);
  });

  return roots;
}

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
      },
    });

    const tree = buildTree(comments as unknown as FlatComment[]);

    return NextResponse.json({ comments: tree, total: comments.length });
  } catch (err) {
    console.error("Failed to fetch comments:", err);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to comment" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { postId, content, parentId } = body as {
      postId?: string;
      content?: string;
      parentId?: string | null;
    };

    if (!postId || !content?.trim()) {
      return NextResponse.json(
        { error: "postId and content are required" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: "Comment is too long" }, { status: 400 });
    }

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.postId !== postId) {
        return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId,
        parentId: parentId ?? null,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
      },
    });

    return NextResponse.json({ ...comment, replies: [] }, { status: 201 });
  } catch (err) {
    console.error("Failed to create comment:", err);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}

