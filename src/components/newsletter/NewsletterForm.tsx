"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";

type Status = "idle" | "loading" | "success" | "error";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative w-full h-full max-w-sm overflow-hidden bg-accent-tint rounded-none border-2 border-border-heavy border-l-[3px] border-l-accent shadow-brutal p-6 flex flex-col justify-center text-center"
    >
      {status === "success" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative flex flex-col items-center gap-3"
        >
          <div className="w-10 h-10 rounded-none bg-foreground flex items-center justify-center border-2 border-border-heavy shadow-brutal-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-background">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="text-lg font-extrabold text-foreground tracking-tight">Almost there</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative flex flex-col items-center"
        >
          <motion.span
            variants={item}
            className="tag-pill bg-accent text-on-accent mb-5"
          >
            Stay in the loop
          </motion.span>

          <motion.h3 variants={item} className="text-lg font-extrabold text-foreground leading-tight tracking-tight">
            Subscribe to our newsletter
          </motion.h3>
          <motion.p variants={item} className="text-sm text-muted-foreground mt-2 max-w-[15rem]">
            Get our newest articles and news instantly.
          </motion.p>

          <motion.form
            variants={item}
            onSubmit={handleSubmit}
            className="w-full mt-6 space-y-3"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={status === "loading"}
              className="w-full rounded-none border-2 border-border-heavy bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors duration-100 focus:border-accent disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-none bg-foreground border-2 border-border-heavy shadow-brutal-sm brutal-press px-4 py-3 text-sm font-bold uppercase tracking-wide text-background disabled:opacity-60"
            >
              {status === "loading" ? "Subscribing…" : "Subscribe"}
            </button>
          </motion.form>

          {status === "error" && message && (
            <p className="mt-3 text-sm text-danger">{message}</p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}