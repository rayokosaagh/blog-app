// src/app/api/posts/[id]/rating/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { randomUUID } from "crypto";

const COOKIE_NAME = "rating_voter_token";

function getVoterToken(req: NextRequest): string | undefined {
  return req.cookies.get(COOKIE_NAME)?.value;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/posts/[id]/rating -> { average, count, userValue }
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id: postId } = await params;

  const session = await auth();
  const userId = session?.user?.id;
  const voterToken = userId ? undefined : getVoterToken(req);

  const [agg, mine] = await Promise.all([
    prisma.rating.aggregate({
      where: { postId },
      _avg: { value: true },
      _count: { value: true },
    }),
    userId
      ? prisma.rating.findUnique({
          where: { postId_userId: { postId, userId } },
        })
      : voterToken
      ? prisma.rating.findUnique({
          where: { postId_voterToken: { postId, voterToken } },
        })
      : null,
  ]);

  return NextResponse.json({
    average: agg._avg.value ?? 0,
    count: agg._count.value ?? 0,
    userValue: mine?.value ?? null,
  });
}

// POST /api/posts/[id]/rating  body: { value: number (1-10) }
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: postId } = await params;

  const body = await req.json().catch(() => null);
  const value = Number(body?.value);

  if (!Number.isInteger(value) || value < 1 || value > 10) {
    return NextResponse.json(
      { error: "value must be an integer between 1 and 10" },
      { status: 400 }
    );
  }

  const session = await auth();
  const userId = session?.user?.id;

  let voterToken = userId ? undefined : getVoterToken(req);
  const settingNewCookie = !userId && !voterToken;
  if (!userId && !voterToken) {
    voterToken = randomUUID();
  }

  if (userId) {
    await prisma.rating.upsert({
      where: { postId_userId: { postId, userId } },
      create: { postId, userId, value },
      update: { value },
    });
  } else {
    await prisma.rating.upsert({
      where: { postId_voterToken: { postId, voterToken: voterToken! } },
      create: { postId, voterToken, value },
      update: { value },
    });
  }

  const agg = await prisma.rating.aggregate({
    where: { postId },
    _avg: { value: true },
    _count: { value: true },
  });

  const res = NextResponse.json({
    ok: true,
    average: agg._avg.value ?? 0,
    count: agg._count.value ?? 0,
    userValue: value,
  });

  if (settingNewCookie && voterToken) {
    res.cookies.set(COOKIE_NAME, voterToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });
  }

  return res;
}