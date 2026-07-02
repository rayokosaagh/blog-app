import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const polls = await prisma.poll.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        options: {
          orderBy: { order: "asc" },
          include: { _count: { select: { votes: true } } },
        },
      },
    });

    const formatted = polls.map((poll) => ({
      id: poll.id,
      question: poll.question,
      isActive: poll.isActive,
      endsAt: poll.endsAt,
      createdAt: poll.createdAt,
      totalVotes: poll.options.reduce((sum, o) => sum + o._count.votes, 0),
      options: poll.options.map((o) => ({
        id: o.id,
        label: o.label,
        order: o.order,
        votes: o._count.votes,
      })),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/polls error:", error);
    return NextResponse.json({ error: "Failed to fetch polls" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { question, options, endsAt, isActive } = await req.json();
    const cleanOptions = Array.isArray(options)
      ? options.map((o: string) => o.trim()).filter(Boolean)
      : [];

    if (!question || cleanOptions.length < 2) {
      return NextResponse.json(
        { error: "Question and at least 2 options are required" },
        { status: 400 }
      );
    }

    const poll = await prisma.poll.create({
      data: {
        question,
        isActive: isActive ?? true,
        endsAt: endsAt ? new Date(endsAt) : null,
        options: {
          create: cleanOptions.map((label: string, index: number) => ({
            label,
            order: index,
          })),
        },
      },
      include: { options: true },
    });

    return NextResponse.json(poll, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/polls error:", error);
    return NextResponse.json({ error: error.message || "Failed to create poll" }, { status: 500 });
  }
}