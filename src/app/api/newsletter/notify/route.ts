import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notifySubscribersOfNewPost } from "@/lib/notifySubscribers";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await req.json();
  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Adjust field names below to match your actual Post model
  // (e.g. post.excerpt vs post.summary vs post.description, post.slug)
  const count = await notifySubscribersOfNewPost({
    title: post.title,
    excerpt: post.excerpt ?? "",
    slug: post.slug,
    featuredImage: post.featuredImage,
  });

  return NextResponse.json({ message: `Notified ${count} subscribers.`, count });
}