import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";

    const ads = await (prisma as any).ad.findMany({
      where: isAdmin ? {} : { active: true },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(Array.isArray(ads) ? ads : []);
  } catch (error) {
    console.error("GET /api/ads error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    console.log("POST /api/ads body:", body);

    const { title, image, link, position, active } = body;

    if (!title || !image || !link) {
      return NextResponse.json(
        { error: "Title, image and link are required" },
        { status: 400 }
      );
    }

    console.log("prisma.ad available?", !!(prisma as any).ad);

    const ad = await (prisma as any).ad.create({
      data: { title, image, link, position: position ?? 0, active: active ?? true },
    });

    return NextResponse.json(ad, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/ads error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create ad" },
      { status: 500 }
    );
  }
}