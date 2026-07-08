import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, NEWSLETTER_FROM, APP_URL } from "@/lib/resend";
import { welcomeEmail } from "@/lib/newsLetterEmails";

export async function GET(req: NextRequest) {
  console.log("=== /api/newsletter/confirm HIT ===");
  const token = req.nextUrl.searchParams.get("token");
  console.log("token:", token);

  if (!token) {
    console.log("no token, redirecting to invalid");
    return NextResponse.redirect(`${APP_URL}/newsletter/confirmed?status=invalid`);
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { token },
  });
  console.log("subscriber found:", subscriber);

  if (!subscriber) {
    console.log("no subscriber matched this token, redirecting to invalid");
    return NextResponse.redirect(`${APP_URL}/newsletter/confirmed?status=invalid`);
  }

  if (!subscriber.confirmed) {
    console.log("updating subscriber to confirmed...");
    const updated = await prisma.newsletterSubscriber.update({
      where: { token },
      data: { confirmed: true, confirmedAt: new Date() },
    });
    console.log("update result:", updated);

    try {
      const { subject, html } = welcomeEmail(subscriber.token);
      console.log("sending welcome email to:", subscriber.email);
      const emailResult = await resend.emails.send({
        from: NEWSLETTER_FROM,
        to: subscriber.email,
        subject,
        html,
      });
      console.log("welcome email result:", emailResult);
    } catch (emailErr) {
      // Don't let a failed welcome email block confirmation
      console.error("welcome email failed (non-fatal):", emailErr);
    }
  } else {
    console.log("subscriber already confirmed, skipping update");
  }

  console.log("redirecting to success");
  return NextResponse.redirect(`${APP_URL}/newsletter/confirmed?status=success`);
}