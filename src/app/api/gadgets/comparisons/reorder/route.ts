import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// Body: { order: string[] } — comparison ids in their new display order
export async function POST(req: NextRequest) {
  const { order } = await req.json();

  if (!Array.isArray(order) || order.some((id) => typeof id !== "string")) {
    return Response.json({ error: "Invalid payload — expected an array of ids" }, { status: 400 });
  }

  try {
    await prisma.$transaction(
      order.map((id: string, index: number) =>
        prisma.comparison.update({ where: { id }, data: { order: index } })
      )
    );
    return Response.json({ success: true });
  } catch (e: any) {
    console.error("POST /api/gadgets/comparisons/reorder failed:", e);
    return Response.json({ error: "Failed to save new order" }, { status: 500 });
  }
}