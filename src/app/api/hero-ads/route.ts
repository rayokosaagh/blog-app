import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Hero-rail ads (homepage AdCarousel). Same contract as /api/ads, own table —
 * see the HeroAd model comment for why the two are kept apart.
 * GET: admins get every row (dashboard list); everyone else active only.
 */
export async function GET() {
  try {
    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";
    const ads = await prisma.heroAd.findMany({
      where: isAdmin ? {} : { active: true },
      orderBy: { position: "asc" },
    });
    return NextResponse.json(ads);
  } catch (error) {
    console.error("GET /api/hero-ads error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { title, image, link, position, active } = await req.json();
    if (!title || !image || !link) {
      return NextResponse.json({ error: "Title, image and link are required" }, { status: 400 });
    }
    const ad = await prisma.heroAd.create({
      data: { title, image, link, position: Number(position) || 0, active: active ?? true },
    });
    return NextResponse.json(ad, { status: 201 });
  } catch (error) {
    console.error("POST /api/hero-ads error:", error);
    return NextResponse.json({ error: "Failed to create ad" }, { status: 500 });
  }
}
