import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET all posts (with search + tag filter)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";

    const posts = await prisma.post.findMany({
      where: {
        published: true,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(tag
          ? {
              tags: {
                some: { slug: tag },
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { author: true, tags: true },
    });

    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// CREATE POST
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const { title, slug, content, published, featuredImage, tagIds } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "Title, slug and content are required" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        published: published ?? false,
        featuredImage: featuredImage || null,
        authorId: session.user.id,
        // Preserve the exact order tags were selected in the picker.
        tagOrder: tagIds ?? [],
        ...(tagIds && tagIds.length > 0
          ? { tags: { connect: tagIds.map((id: string) => ({ id })) } }
          : {}),
      },
      include: { tags: true },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    console.error("POST error:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 }
    );
  }
}