import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { active, verdictA, verdictB } = body;

  // Blank input clears the verdict rather than storing "". /compare reads null
  // as "no editor copy — derive one from the specs"; an empty string would
  // suppress that fallback and render nothing at all.
  const verdict = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

  try {
    const comparison = await prisma.comparison.update({
      where: { id },
      data: {
        ...(active !== undefined && { active }),
        ...(verdictA !== undefined && { verdictA: verdict(verdictA) }),
        ...(verdictB !== undefined && { verdictB: verdict(verdictB) }),
      },
      include: { category: true, productA: true, productB: true },
    });
    return Response.json({ comparison });
  } catch (e: any) {
    if (e.code === "P2025") {
      return Response.json({ error: "Comparison not found" }, { status: 404 });
    }
    console.error("PATCH /api/gadgets/comparisons/[id] failed:", e);
    return Response.json({ error: "Failed to update comparison" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.comparison.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (e: any) {
    if (e.code === "P2025") {
      return Response.json({ error: "Comparison not found" }, { status: 404 });
    }
    console.error("DELETE /api/gadgets/comparisons/[id] failed:", e);
    return Response.json({ error: "Failed to delete comparison" }, { status: 500 });
  }
}