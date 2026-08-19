import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verdictFieldsFromBody } from "@/lib/verdict";
import { DEFAULT_POST_CATEGORY, isPostCategory } from "@/lib/blog/categories";

// GET all posts (with search + tag filter)
// Used by the dashboard: admins see every post, everyone else sees only their own.
export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";

    const isAdmin = session.user.role === "ADMIN";

    const posts = await prisma.post.findMany({
      where: {
        // Non-admins only ever see their own posts (published or draft).
        // Admins see everything.
        ...(isAdmin ? {} : { authorId: session.user.id }),
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
      include: {
        author: { select: { id: true, name: true, image: true } },
        tags: true,
      },
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

    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const { title, slug, content, published, featuredImage, tagIds, category } = body;

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
        // Unknown or missing category falls back to the default rather than
        // 400ing — an older client that never sends one must still publish.
        category: isPostCategory(category) ? category : DEFAULT_POST_CATEGORY,
        authorId: session.user.id,
        // Preserve the exact order tags were selected in the picker.
        tagOrder: tagIds ?? [],
        ...verdictFieldsFromBody(body),
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