// src/app/offline/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";

// Served by the service worker when a navigation fails and nothing matching is
// cached. Kept deliberately free of data fetching — it has to render with no
// network at all, so anything that touches the DB would defeat the point.
export const metadata: Metadata = {
  title: "You're offline",
  description: "This page isn't available without a connection.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md border-4 border-border-heavy bg-card p-8 text-center shadow-brutal-lg">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border-2 border-border-heavy bg-accent-2 text-on-accent-2">
          <WifiOff className="h-7 w-7" strokeWidth={2.5} />
        </span>

        <h1 className="text-2xl font-black tracking-tight text-foreground">
          You&apos;re offline
        </h1>

        <p className="mt-3 text-sm font-medium leading-relaxed text-muted-foreground">
          We couldn&apos;t reach the site. Pages you&apos;ve already opened are
          still available — everything else will load once you&apos;re back on a
          connection.
        </p>

        <div className="mt-7 flex flex-col gap-2.5">
          <Link
            href="/bookmarks"
            className="brutal-press border-2 border-border-heavy bg-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-on-accent shadow-brutal-sm"
          >
            Your bookmarks
          </Link>
          <Link
            href="/"
            className="brutal-press border-2 border-border-heavy bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-foreground shadow-brutal-sm"
          >
            Try the homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
