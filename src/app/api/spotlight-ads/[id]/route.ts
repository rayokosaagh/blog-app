import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { mediaTypeFromUrl } from "@/lib/mediaType";

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
    const { title, mediaUrl, link, position, active } = await req.json();

    // Only recompute mediaType when a new mediaUrl is supplied.
    const data: Record<string, unknown> = { title, link, position, active };
    if (mediaUrl !== undefined) {
      data.mediaUrl = mediaUrl;
      data.mediaType = mediaTypeFromUrl(mediaUrl);
    }

    const ad = await (prisma as any).spotlightAd.update({
      where: { id },
      data,
    });

    revalidatePath("/");
    return NextResponse.json(ad);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update spotlight ad" }, { status: 500 });
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
    await (prisma as any).spotlightAd.delete({ where: { id } });
    revalidatePath("/");
    return NextResponse.json({ message: "Spotlight ad deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete spotlight ad" }, { status: 500 });
  }
}
