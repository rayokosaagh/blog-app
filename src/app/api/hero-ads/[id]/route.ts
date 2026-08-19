import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const { title, image, link, position, active } = await req.json();
    const ad = await prisma.heroAd.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(image !== undefined && { image }),
        ...(link !== undefined && { link }),
        ...(position !== undefined && { position: Number(position) || 0 }),
        ...(active !== undefined && { active: !!active }),
      },
    });
    return NextResponse.json(ad);
  } catch (error) {
    console.error("PATCH /api/hero-ads/[id] error:", error);
    return NextResponse.json({ error: "Failed to update ad" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    await prisma.heroAd.delete({ where: { id } });
    return NextResponse.json({ message: "Ad deleted" });
  } catch (error) {
    console.error("DELETE /api/hero-ads/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete ad" }, { status: 500 });
  }
}
