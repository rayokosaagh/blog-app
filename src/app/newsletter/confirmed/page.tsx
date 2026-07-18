import Link from "next/link";

const COPY: Record<string, { title: string; body: string }> = {
  success: {
    title: "You're subscribed 🎉",
    body: "Thanks for confirming — you'll now get new posts and updates in your inbox.",
  },
  unsubscribed: {
    title: "You've been unsubscribed",
    body: "You won't receive any more emails from us. Sorry to see you go.",
  },
  invalid: {
    title: "That link isn't valid",
    body: "The confirmation link is invalid or has expired. Try subscribing again.",
  },
};

export default async function NewsletterConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const copy = COPY[status ?? "invalid"] ?? COPY.invalid;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-extrabold text-foreground">
        {copy.title}
      </h1>
      <p className="max-w-md text-muted-foreground">{copy.body}</p>
      <Link
        href="/"
        className="mt-2 border-2 border-border-heavy rounded-none bg-background text-foreground font-extrabold text-xs uppercase tracking-wide shadow-brutal-sm brutal-press px-5 py-2.5"
      >
        Back to home
      </Link>
    </div>
  );
}