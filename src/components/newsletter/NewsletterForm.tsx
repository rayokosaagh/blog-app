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
  const [focused, setFocused] = useState(false);

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
      className="relative w-full h-full max-w-sm overflow-hidden bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none dark:border border-border p-6 flex flex-col justify-center text-center"
    >
      {/* Ambient drifting glow */}
      <motion.div
        aria-hidden
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl"
      />
      <motion.div
        aria-hidden
        animate={{ x: [0, -15, 0], y: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl"
      />

      {status === "success" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex flex-col items-center gap-3"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="w-12 h-12 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
          <h3 className="text-lg font-bold text-foreground">Almost there</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative flex flex-col items-center"
        >
          {/* Icon with pulsing ring */}
          <motion.div variants={item} className="relative mb-5">
            <motion.span
              aria-hidden
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-blue-500/40"
            />
            <motion.div
              whileHover={{ rotate: -8, scale: 1.08 }}
              transition={{ type: "spring", stiffness: 300, damping: 12 }}
              className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 7.5 12 13l9-5.5" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="3" y="5" width="18" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </motion.div>

          <motion.h3 variants={item} className="text-lg font-bold text-foreground leading-tight">
            Subscribe to our newsletter
          </motion.h3>
          <motion.p variants={item} className="text-sm text-muted-foreground mt-2 max-w-[15rem]">
            Get our newest articles and news instantly!
          </motion.p>

          <motion.form
            variants={item}
            onSubmit={handleSubmit}
            className="w-full mt-6 space-y-3"
          >
            <div
              className={`relative rounded-xl transition-shadow ${
                focused ? "ring-2 ring-blue-500/30 dark:ring-blue-400/30" : ""
              }`}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="you@example.com"
                disabled={status === "loading"}
                className="w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-blue-500 dark:focus:border-blue-400 disabled:opacity-60"
              />
            </div>

            <motion.button
              type="submit"
              disabled={status === "loading"}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              className="group relative w-full overflow-hidden rounded-xl bg-blue-600 dark:bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-60"
            >
              {/* Shimmer sweep on hover */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">
                {status === "loading" ? "Subscribing…" : "Subscribe"}
              </span>
            </motion.button>
          </motion.form>

          {status === "error" && message && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{message}</p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}