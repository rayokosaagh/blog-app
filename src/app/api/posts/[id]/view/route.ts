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

    await prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

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