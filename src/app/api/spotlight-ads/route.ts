import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { mediaTypeFromUrl } from "@/lib/mediaType";

export async function GET() {
  try {
    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";

    const ads = await (prisma as any).spotlightAd.findMany({
      where: isAdmin ? {} : { active: true },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(Array.isArray(ads) ? ads : []);
  } catch (error) {
    console.error("GET /api/spotlight-ads error:", error);
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
    const { title, mediaUrl, link, position, active } = body;

    if (!title || !mediaUrl || !link) {
      return NextResponse.json(
        { error: "Title, media and link are required" },
        { status: 400 }
      );
    }

    const mediaType = body.mediaType || mediaTypeFromUrl(mediaUrl);

    const ad = await (prisma as any).spotlightAd.create({
      data: {
        title,
        mediaUrl,
        mediaType,
        link,
        position: position ?? 0,
        active: active ?? true,
      },
    });

    revalidatePath("/");
    return NextResponse.json(ad, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/spotlight-ads error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create spotlight ad" },
      { status: 500 }
    );
  }
}
