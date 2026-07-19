// src/app/api/popup-ads/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("✅ GET - ID:", id);

    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const popupAd = await prisma.popupAd.findUnique({ where: { id } });

    if (!popupAd) {
      return NextResponse.json({ error: "Popup ad not found" }, { status: 404 });
    }

    return NextResponse.json(popupAd);
  } catch (error: any) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("✅ PATCH - ID received:", id);

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const popupAd = await prisma.popupAd.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
        ...(body.linkUrl !== undefined && { linkUrl: body.linkUrl || null }),
        ...(body.linkText !== undefined && { linkText: body.linkText }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.startDate !== undefined && { 
          startDate: body.startDate ? new Date(body.startDate) : null 
        }),
        ...(body.endDate !== undefined && { 
          endDate: body.endDate ? new Date(body.endDate) : null 
        }),
      },
    });

    return NextResponse.json(popupAd);
  } catch (error: any) {
    console.error("PATCH error:", error);
    return NextResponse.json({ error: error.message || "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("✅ DELETE - ID received:", id);

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.popupAd.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete" }, { status: 500 });
  }
}