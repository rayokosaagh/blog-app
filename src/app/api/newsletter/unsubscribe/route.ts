import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, NEWSLETTER_FROM, APP_URL } from "@/lib/resend";
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

    const { subject, html } = welcomeEmail(subscriber.token);
    await resend.emails.send({
      from: NEWSLETTER_FROM,
      to: subscriber.email,
      subject,
      html,
    });
  }

  return NextResponse.redirect(`${APP_URL}/newsletter/confirmed?status=success`);
}