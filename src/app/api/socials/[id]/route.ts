import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/socials/[id] - Update Social Link
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { platform, url, iconSvg, actionText, color, order, isActive } = body;

    const updatedLink = await prisma.socialLink.update({
      where: { id },
      data: {
        platform,
        url,
        iconSvg,
        actionText: actionText || "Follow",
        color: color || "#3b82f6",
        order: Number(order) || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(updatedLink);
  } catch (error: any) {
    console.error("Update Social Link Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update social link" }, 
      { status: 500 }
    );
  }
}

// DELETE /api/socials/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.socialLink.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Social link deleted successfully" });
  } catch (error) {
    console.error("Delete Social Link Error:", error);
    return NextResponse.json(
      { error: "Failed to delete social link" }, 
      { status: 500 }
    );
  }
}