import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["WANT", "HAVE", "HAD"] as const;
type OwnershipStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(value: unknown): value is OwnershipStatus {
  return typeof value === "string" && (VALID_STATUSES as readonly string[]).includes(value);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id: productId } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;

  if (!isValidStatus(status)) {
    return NextResponse.json(
      { error: `status must be one of ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const userId = session.user.id;

  const existing = await prisma.productOwnership.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  // Clicking the currently-selected status again clears it (un-vote).
  if (existing && existing.status === status) {
    await prisma.productOwnership.delete({ where: { id: existing.id } });
  } else {
    await prisma.productOwnership.upsert({
      where: { userId_productId: { userId, productId } },
      update: { status },
      create: { userId, productId, status },
    });
  }

  const counts = await prisma.productOwnership.groupBy({
    by: ["status"],
    where: { productId },
    _count: true,
  });

  const countMap: Record<OwnershipStatus, number> = { WANT: 0, HAVE: 0, HAD: 0 };
  for (const c of counts) countMap[c.status as OwnershipStatus] = c._count;

  const updated = await prisma.productOwnership.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  return NextResponse.json({
    counts: countMap,
    userStatus: updated?.status ?? null,
  });
}