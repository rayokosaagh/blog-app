import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { title, image, link, position, active } = await req.json();

    const ad = await (prisma as any).ad.update({
      where: { id },
      data: { title, image, link, position, active },
    });

    return NextResponse.json(ad);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update ad" }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await (prisma as any).ad.delete({ where: { id } });
    return NextResponse.json({ message: "Ad deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete ad" }, { status: 500 });
  }
}