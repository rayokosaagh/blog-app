"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Check, Copy } from "lucide-react";

/**
 * The address that 404'd, with a copy button — the 404 analogue of an error
 * page's reference id. Client-side because the not-found boundary has no
 * request context to read the path from on the server.
 */
export default function RequestedPath() {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(
        typeof window === "undefined" ? pathname : window.location.href
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked by permissions; the path is still readable.
    }
  }

  return (
    <div className="mt-8 flex max-w-md items-stretch overflow-hidden surface-border border-border-heavy bg-card">
      <span className="flex shrink-0 items-center px-4 py-3 text-sm font-bold text-foreground">
        Address
      </span>
      <span className="w-px shrink-0 self-stretch bg-border" aria-hidden />
      <code className="flex min-w-0 flex-1 items-center truncate px-4 py-3 font-mono text-sm text-accent">
        {pathname}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Address copied" : "Copy address"}
        className="flex shrink-0 items-center justify-center px-4 text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
