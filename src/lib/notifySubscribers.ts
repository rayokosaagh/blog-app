import { prisma } from "@/lib/prisma";
import { resend, NEWSLETTER_FROM } from "@/lib/resend";
import { newPostNotificationEmail } from "@/lib/newsLetterEmails";

const BATCH_SIZE = 100; // Resend's batch.send max per call

/**
 * Emails every confirmed subscriber about a new post.
 * Returns how many subscribers were notified.
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
    const { subject, html } = newPostNotificationEmail({
      title: post.title,
      excerpt: post.excerpt,
      url,
      token: s.token,
      featuredImage: post.featuredImage,
    });
    return {
      from: NEWSLETTER_FROM,
      to: s.email,
      subject,
      html,
    };
  });

  // Send in batches of 100 to stay within Resend's batch.send limit
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);
    await resend.batch.send(chunk);
  }

  return subscribers.length;
}