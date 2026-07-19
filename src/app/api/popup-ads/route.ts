// src/app/api/popup-ads/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";
    const now = new Date();

    const popupAds = await prisma.popupAd.findMany({
      where: activeOnly
        ? {
            isActive: true,
            OR: [{ startDate: null }, { startDate: { lte: now } }],
            AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
          }
        : {},
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(popupAds);
  } catch (error) {
    console.error("GET /api/popup-ads error:", error);
    return NextResponse.json(
      { error: "Failed to fetch popup ads" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      imageUrl,
      linkUrl,
      linkText,
      isActive,
      startDate,
      endDate,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const popupAd = await prisma.popupAd.create({
      data: {
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        linkText: linkText || "Learn More",
        isActive: isActive ?? true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json(popupAd, { status: 201 });
  } catch (error) {
    console.error("POST /api/popup-ads error:", error);
    return NextResponse.json(
      { error: "Failed to create popup ad" },
      { status: 500 }
    );
  }
}