import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send";
import { APP_URL } from "@/lib/appUrl";
import { welcomeEmail } from "@/lib/newsLetterEmails";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/newsletter/confirmed?status=invalid`);
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { token },
  });

  if (!subscriber) {
    return NextResponse.redirect(`${APP_URL}/newsletter/confirmed?status=invalid`);
  }

  if (!subscriber.confirmed) {
    await prisma.newsletterSubscriber.update({
      where: { token },
      data: { confirmed: true, confirmedAt: new Date() },
    });

    try {
      const { subject, text, html } = welcomeEmail(subscriber.token);
      await sendEmail({
        to: subscriber.email,
        subject,
        text,
        html,
      });
    } catch (emailErr) {
      console.error("welcome email failed (non-fatal):", emailErr);
    }
  }

  return NextResponse.redirect(`${APP_URL}/newsletter/confirmed?status=success`);
}