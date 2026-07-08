import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, NEWSLETTER_FROM } from "@/lib/resend";
import { confirmSubscriptionEmail } from "@/lib/newsLetterEmails";
// Adjust this import to match your actual auth setup (see src/auth/index.ts)
import { auth } from "@/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing?.confirmed) {
      return NextResponse.json(
        { message: "You're already subscribed." },
        { status: 200 }
      );
    }

    // Reuse existing row (resend confirmation) or create a new one
    const subscriber = existing
      ? existing
      : await prisma.newsletterSubscriber.create({
          data: { email: normalizedEmail },
        });

    const { subject, html } = confirmSubscriptionEmail(subscriber.token);

    await resend.emails.send({
      from: NEWSLETTER_FROM,
      to: normalizedEmail,
      subject,
      html,
    });

    return NextResponse.json(
      { message: "Check your inbox to confirm your subscription." },
      { status: 201 }
    );
  } catch (err) {
    console.error("Newsletter subscribe error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// Admin: list subscribers for the dashboard
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(subscribers);
}