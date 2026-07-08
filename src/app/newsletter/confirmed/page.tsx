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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {copy.title}
      </h1>
      <p className="max-w-md text-gray-600 dark:text-gray-400">{copy.body}</p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900"
      >
        Back to home
      </Link>
    </div>
  );
}