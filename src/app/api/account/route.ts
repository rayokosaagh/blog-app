import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Prisma } from "@/generated/prisma";
import { validateAuthorProfile } from "@/lib/authorProfile";

// Self-service account endpoint, scoped to the signed-in user only. Unlike
// /api/users/[id] (ADMIN-only, can change anyone's role/email), this never
// takes an id from the request — it always reads/writes session.user.id, so
// there's no path by which a reader could touch another account.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        bio: true,
        socials: true,
        _count: { select: { bookmarks: true, comments: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error("Failed to fetch account:", err);
    return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, image, bio, socials } = body as {
      name?: string;
      image?: string | null;
      bio?: unknown;
      socials?: unknown;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (name.trim().length > 80) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }

    // Author profile fields are only meaningful for staff, who write posts;
    // a reader's request carrying them is saved without them.
    const isStaff = session.user.role === "ADMIN" || session.user.role === "EDITOR";
    const profile = isStaff ? validateAuthorProfile({ bio, socials }) : { ok: true as const };
    if (!profile.ok) {
      return NextResponse.json({ error: profile.error }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        image: image ?? null,
        ...("bio" in profile && { bio: profile.bio }),
        ...("socials" in profile && { socials: profile.socials ?? Prisma.DbNull }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        bio: true,
        socials: true,
        _count: { select: { bookmarks: true, comments: true } },
      },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error("Failed to update account:", err);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}
