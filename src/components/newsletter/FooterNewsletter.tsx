"use client";

import { useState, FormEvent } from "react";

type Status = "idle" | "loading" | "success" | "error";

// Footer-specific newsletter design: a flat, left-aligned inline form
// (underline input + terms checkbox + solid accent button) — intentionally
// different from the bordered card <NewsletterForm />. Same /api/newsletter
// wiring underneath.
export default function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong.");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "Check your inbox to confirm.");
      setEmail("");
      setAgreed(false);
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="max-w-sm">
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent">
        Want to hear from us?
      </p>
      <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
        Subscribe to our newsletter
      </h3>

      {status === "success" ? (
        <p className="mt-5 flex items-center gap-2 text-sm font-bold text-foreground">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-none border-2 border-border-heavy bg-accent text-on-accent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {message}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={status === "loading"}
            aria-label="Email address"
            className="w-full border-0 border-b-2 border-border-heavy bg-transparent pb-2 text-base text-foreground placeholder-muted-foreground outline-none transition-colors duration-100 focus:border-accent disabled:opacity-60"
          />

          <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              /* 16x16 was the entire hit area for the one control gating the
                 subscribe button. Grown to 24x24 (the WCAG 2.2 minimum) — the
                 surrounding <label> is clickable too, but the box itself
                 shouldn't be the hard part. */
              className="h-6 w-6 shrink-0 rounded-none border-2 border-border-heavy accent-[var(--accent)]"
            />
            <span>
              I agree to the{" "}
              <span className="font-bold text-foreground">terms &amp; conditions</span>
            </span>
          </label>

          <button
            type="submit"
            disabled={status === "loading" || !agreed}
            className="mt-6 rounded-none border-2 border-border-heavy bg-accent px-8 py-3 text-sm font-bold uppercase tracking-wide text-on-accent shadow-brutal-sm brutal-press disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "loading" ? "Subscribing…" : "Subscribe"}
          </button>

          {status === "error" && message && (
            <p className="mt-3 text-sm font-bold text-danger">{message}</p>
          )}
        </form>
      )}
    </div>
  );
}
