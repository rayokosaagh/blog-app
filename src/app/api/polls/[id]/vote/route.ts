import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { auth } from "@/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const { optionId } = await req.json();
    if (!optionId) return NextResponse.json({ error: "optionId is required" }, { status: 400 });

    const poll = await prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    if (!poll.isActive) return NextResponse.json({ error: "This poll is closed" }, { status: 400 });
    if (poll.endsAt && new Date(poll.endsAt) < new Date()) {
      return NextResponse.json({ error: "This poll has ended" }, { status: 400 });
    }

    const session = await auth();
    const userId = session?.user?.id ?? null;

    let voterToken: string | null = null;
    let existingVote;

    if (userId) {
      existingVote = await prisma.pollVote.findUnique({
        where: { pollId_userId: { pollId, userId } },
      });
    } else {
      const cookieStore = await cookies();
      voterToken = cookieStore.get("poll_voter_token")?.value ?? null;
      if (!voterToken) voterToken = randomUUID();

      existingVote = await prisma.pollVote.findUnique({
        where: { pollId_voterToken: { pollId, voterToken } },
      });
    }

    if (existingVote) {
      return NextResponse.json({ error: "You have already voted in this poll" }, { status: 409 });
    }

    await prisma.pollVote.create({
      data: {
        pollId,
        optionId,
        userId,
        voterToken: userId ? null : voterToken,
      },
    });

    const updatedOptions = await prisma.pollOption.findMany({
      where: { pollId },
      orderBy: { order: "asc" },
      include: { _count: { select: { votes: true } } },
    });
    const totalVotes = updatedOptions.reduce((sum, o) => sum + o._count.votes, 0);

    const response = NextResponse.json({
      success: true,
      votedOptionId: optionId,
      totalVotes,
      options: updatedOptions.map((o) => ({ id: o.id, label: o.label, votes: o._count.votes })),
    });

    if (!userId && voterToken) {
      response.cookies.set("poll_voter_token", voterToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }

    return response;
  } catch (error: any) {
    console.error("POST /api/polls/[id]/vote error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit vote" }, { status: 500 });
  }
}