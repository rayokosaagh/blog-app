import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, email, password, role, image } = await req.json();

    if (!name?.trim() || !email?.trim() || !role) {
      return NextResponse.json(
        { error: "Name, email and role are required" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {
      name: name.trim(),
      email: email.trim(),
      role,
      // Allow explicitly clearing the image by passing null
      image: image ?? null,
    };

    if (password?.trim()) {
      data.password = await bcrypt.hash(password.trim(), 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("[PATCH /api/users]", error?.message ?? error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email already taken" }, { status: 400 });
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.user.id === id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/users]", error?.message ?? error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}