import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET all banners (for admin - show active + inactive)
export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json(banners);
  } catch (error) {
    console.error("GET /api/banners error:", error);
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
  }
}

// POST - Create new banner
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, description, badge, cta, image, link, order } = await req.json();

    if (!title || !image || !link) {
      return NextResponse.json(
        { error: "Title, image and link are required" },
        { status: 400 }
      );
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        description: description || null,
        badge: badge || null,
        cta: cta || null,
        image,
        link,
        active: true,
        order: order ?? 0,
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error("POST /api/banners error:", error);
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
  }
}