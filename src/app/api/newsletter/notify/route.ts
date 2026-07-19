import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notifySubscribersOfNewPost } from "@/lib/notifySubscribers";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { postId } = await req.json();
  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // The Post model has no excerpt column, so derive one from the HTML content:
  // strip tags, collapse whitespace, and cap the length for the email preview.
  const plain = post.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const excerpt = plain.length > 200 ? `${plain.slice(0, 200).trimEnd()}…` : plain;

  const count = await notifySubscribersOfNewPost({
    title: post.title,
    excerpt,
    slug: post.slug,
    featuredImage: post.featuredImage,
  });

  return NextResponse.json({ message: `Notified ${count} subscribers.`, count });
}