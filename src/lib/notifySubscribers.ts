import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send";
import { newPostNotificationEmail } from "@/lib/newsLetterEmails";

/**
 * How many messages to have in flight at once.
 *
 * Gmail SMTP has no batch endpoint — the previous provider accepted 100
 * messages per API call, this one is one message per send. A small amount of
 * concurrency keeps the fan-out from crawling, but it stays deliberately low:
 * Gmail throttles aggressive senders, and nodemailer's pooled transport is
 * doing the connection reuse underneath.
 *
 * Note the hard ceiling this transport brings with it — roughly 500
 * recipients/day on a free Gmail account, ~2,000 on Workspace. Past that,
 * this needs a real bulk provider again.
 */
const CONCURRENCY = 5;

/**
 * Emails every confirmed subscriber about a new post.
 * Returns how many subscribers were successfully notified.
 */
export async function notifySubscribersOfNewPost(post: {
  title: string;
  excerpt: string;
  slug: string;
  featuredImage?: string | null;
}) {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { confirmed: true },
    select: { email: true, token: true },
  });

  if (subscribers.length === 0) return 0;

  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/blog/${post.slug}`;

  const emails = subscribers.map((s) => {
    const { subject, text, html } = newPostNotificationEmail({
      title: post.title,
      excerpt: post.excerpt,
      url,
      token: s.token,
      featuredImage: post.featuredImage,
    });
    return { to: s.email, subject, text, html };
  });

  // One send per recipient, a few at a time. Count only what actually left —
  // returning subscribers.length regardless (as the batch version did) would
  // report a clean run even when every message bounced off a bad app password.
  let sent = 0;
  for (let i = 0; i < emails.length; i += CONCURRENCY) {
    const results = await Promise.all(
      emails.slice(i, i + CONCURRENCY).map((m) => sendEmail(m))
    );
    sent += results.filter((r) => r.ok).length;
  }

  if (sent < emails.length) {
    console.error(
      `[newsletter] notified ${sent}/${emails.length} subscribers — see [email] errors above`
    );
  }

  return sent;
}