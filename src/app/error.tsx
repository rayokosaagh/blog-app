"use client";

import { useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

/**
 * Route-level error boundary. Must be a Client Component — Next requires it,
 * and `reset` is a callback. That rules out <Footer />, which is a Server
 * Component; the navbar is already "use client" so it is fine here.
 *
 * This does NOT catch errors thrown in the root layout. If the layout itself
 * throws, Next falls back to global-error.tsx (not present) and then to its
 * own stock page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The visitor-facing copy below is deliberately vague; the detail belongs
    // in the server logs, not on screen. `digest` is the id to grep for.
    console.error("[route error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-24">
        <p className="text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground">
          Something went wrong
        </p>
        <h1 className="h-display mt-3 text-foreground">
          This page failed to load
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          That is on us, not you. Trying again usually works — the rest of the
          site is unaffected.
        </p>

        {error.digest && (
          <p className="mt-6 text-sm text-muted-foreground">
            Reference:{" "}
            <code className="surface-border bg-card px-2 py-1 font-mono text-xs">
              {error.digest}
            </code>
          </p>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="surface-border bg-accent text-on-accent shadow-brutal-sm brutal-press px-6 py-3 font-bold"
          >
            Try again
          </button>
          <Link href="/" className="font-bold text-accent hover:underline">
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
