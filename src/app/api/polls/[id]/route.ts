import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const body = await req.json();
    const updateData: any = {};
    if (body.question !== undefined) updateData.question = body.question;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.endsAt !== undefined) updateData.endsAt = body.endsAt ? new Date(body.endsAt) : null;

    if (Array.isArray(body.options)) {
      const cleanOptions = body.options
        .map((o: string) => (typeof o === "string" ? o.trim() : ""))
        .filter(Boolean);

      if (cleanOptions.length < 2) {
        return NextResponse.json({ error: "At least 2 options are required" }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.pollOption.deleteMany({ where: { pollId: id } }),
        prisma.poll.update({
          where: { id },
          data: {
            ...updateData,
            options: {
              create: cleanOptions.map((label: string, index: number) => ({ label, order: index })),
            },
          },
        }),
      ]);
    } else if (Object.keys(updateData).length > 0) {
      await prisma.poll.update({ where: { id }, data: updateData });
    } else {
      return NextResponse.json({ error: "No data to update" }, { status: 400 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: { options: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(poll);
  } catch (error: any) {
    console.error("PATCH Poll Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update poll" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    await prisma.poll.delete({ where: { id } }); // cascades options + votes
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Poll Error:", error);
    return NextResponse.json({ error: "Failed to delete poll" }, { status: 500 });
  }
}