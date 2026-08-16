import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/appUrl";

/**
 * Unsubscribe, reached from the link at the foot of every newsletter email.
 *
 * Clears `confirmed` rather than deleting the row, for two reasons:
 *   - The token survives, so the link stays idempotent. Mail clients prefetch
 *     and users double-click; a deleted row would make the second visit report
 *     "that link isn't valid", which reads as a failed unsubscribe.
 *   - `notifySubscribersOfNewPost` selects on `confirmed: true`, so clearing
 *     the flag is what actually stops the mail.
 *
 * Re-subscribing still works: POST /api/newsletter reuses the existing row and
 * sends a fresh confirmation.
 */
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

  // Only write when there is something to change — a repeat visit is a no-op
  // that still reports success.
  if (subscriber.confirmed) {
    await prisma.newsletterSubscriber.update({
      where: { token },
      data: { confirmed: false, confirmedAt: null },
    });
  }

  // No email on the way out. Sending "you've unsubscribed" mail to someone who
  // just asked for no more mail is the one message guaranteed to be unwelcome.
  return NextResponse.redirect(
    `${APP_URL}/newsletter/confirmed?status=unsubscribed`
  );
}
