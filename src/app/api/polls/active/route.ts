import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";

export async function GET() {
  try {
    const now = new Date();
    const session = await auth();

    const polls = await prisma.poll.findMany({
      where: {
        isActive: true,
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        options: {
          orderBy: { order: "asc" },
          include: { _count: { select: { votes: true } } },
        },
      },
    });

    if (polls.length === 0) return NextResponse.json([]);

    const pollIds = polls.map((p) => p.id);
    const userId = session?.user?.id ?? null;

    let myVotes: { pollId: string; optionId: string }[] = [];

    if (userId) {
      myVotes = await prisma.pollVote.findMany({
        where: { pollId: { in: pollIds }, userId },
        select: { pollId: true, optionId: true },
      });
    } else {
      const cookieStore = await cookies();
      const voterToken = cookieStore.get("poll_voter_token")?.value;
      if (voterToken) {
        myVotes = await prisma.pollVote.findMany({
          where: { pollId: { in: pollIds }, voterToken },
          select: { pollId: true, optionId: true },
        });
      }
    }

    const voteMap = new Map(myVotes.map((v) => [v.pollId, v.optionId]));

    const processedPolls = polls.map((poll) => {
      const totalVotes = poll.options.reduce((sum, o) => sum + o._count.votes, 0);
      return {
        id: poll.id,
        question: poll.question,
        endsAt: poll.endsAt,
        totalVotes,
        votedOptionId: voteMap.get(poll.id) ?? null,
        options: poll.options.map((o) => ({
          id: o.id,
          label: o.label,
          votes: o._count.votes,
        })),
      };
    });

    return NextResponse.json(processedPolls);
  } catch (error) {
    console.error("GET /api/polls/active error:", error);
    return NextResponse.json({ error: "Failed to fetch polls" }, { status: 500 });
  }
}