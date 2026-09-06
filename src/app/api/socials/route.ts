import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isSvgIcon, sanitizeSvg } from "@/lib/sanitizeSvg";

export async function GET() {
  try {
    const links = await prisma.socialLink.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json(links);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch social links" }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { platform, url, iconSvg, actionText, color, order } = body;

    const safeIcon =
      typeof iconSvg === "string" && isSvgIcon(iconSvg) ? sanitizeSvg(iconSvg) : iconSvg;

    const newLink = await prisma.socialLink.create({
      data: {
        platform,
        url,
        iconSvg: safeIcon,
        actionText: actionText || "Follow",
        color: color || "#3b82f6",
        order: Number(order) || 0,
        isActive: true,
      },
    });

    return NextResponse.json(newLink, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create social link" }, 
      { status: 500 }
    );
  }
}