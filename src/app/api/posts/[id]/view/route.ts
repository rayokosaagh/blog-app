import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const cookieName = `viewed_${id}`;

    // Already counted this view recently — skip silently.
    if (cookieStore.get(cookieName)) {
      return NextResponse.json({ counted: false });
    }

    // Raw SQL on purpose: prisma.post.update() stamps @updatedAt, which made
    // every view look like an edit ("Last updated" and dateModified tracked
    // the latest reader, not the latest change). Tagged template = bound param.
    const updated = await prisma.$executeRaw`UPDATE "Post" SET "views" = "views" + 1 WHERE "id" = ${id}`;
    if (updated === 0) {
      return NextResponse.json({ counted: false });
    }

    cookieStore.set(cookieName, "1", {
      maxAge: 60 * 60 * 12, // 12 hours
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

   
    revalidatePath("/");

    return NextResponse.json({ counted: true });
  } catch (error) {
    // Fail silently — a missed view increment shouldn't break the page.
    return NextResponse.json({ counted: false }, { status: 200 });
  }
}