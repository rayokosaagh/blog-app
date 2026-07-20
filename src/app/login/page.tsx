"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.48-1.13 2.73-2.4 3.58v2.98h3.88c2.27-2.09 3.54-5.17 3.54-8.8z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.92l-3.88-2.98c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.93H1.3v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.31 14.32A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.58.38-2.32V6.59H1.3A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.3 5.41l4.01-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.3 6.59l4.01 3.09C6.25 6.85 8.89 4.75 12 4.75z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.79-.25.79-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.07.78 2.15 0 1.56-.01 2.81-.01 3.19 0 .3.21.66.8.55A11.5 11.5 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <rect x="2" y="4" width="20" height="16" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <rect x="4" y="10.5" width="16" height="10" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
    </svg>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M2 12s3.5-7 10-7c2.1 0 3.9.66 5.4 1.6M22 12s-3.5 7-10 7c-2.1 0-3.9-.66-5.4-1.6" />
      <path d="M1 1l22 22" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<false | "credentials" | "google" | "github">(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading("credentials");
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleOAuth(provider: "google" | "github") {
    setError("");
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/" });
  }

  const fieldTransition = { duration: prefersReducedMotion ? 0 : 0.22, ease: "easeOut" as const };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      {/* Shared neo-brutalist animated backdrop (grid + flying shapes) */}
      <AnimatedBackground className="absolute inset-0 z-0" />

      <motion.div
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* offset stacked block behind the card — the signature element */}
        <div aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 bg-accent-2 border-[3px] border-border-heavy" />

        <div className="relative bg-card border-[3px] border-border-heavy shadow-brutal-xl p-8">
          <div className="mb-7 flex flex-col items-start">
            <h1 className="!text-4xl font-extrabold uppercase tracking-tight text-foreground tag-pill mb-3 bg-accent text-on-accent">
              Sign in
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter your credentials to login.
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <motion.div
                  animate={prefersReducedMotion ? undefined : { x: [0, -6, 6, -4, 4, 0] }}
                  transition={{ duration: 0.35 }}
                  className="mb-5 flex items-center gap-2 border-[3px] border-border-heavy bg-danger px-3.5 py-2.5 text-sm font-bold text-on-danger"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v5M12 16h.01" />
                  </svg>
                  {error}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fieldTransition, delay: 0.05 }}>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">
                Email
              </label>
              <div className="flex items-center border-[3px] border-border-heavy bg-background focus-within:bg-accent-tint">
                <span className="pl-3.5 text-foreground">
                  <MailIcon />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@blog.com"
                  className="w-full bg-transparent px-3 py-2.5 text-foreground outline-none placeholder:text-muted-foreground font-medium"
                  required
                />
              </div>
            </motion.div>

            <motion.div initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fieldTransition, delay: 0.1 }}>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">
                Password
              </label>
              <div className="flex items-center border-[3px] border-border-heavy bg-background focus-within:bg-accent-tint">
                <span className="pl-3.5 text-foreground">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent px-3 py-2.5 text-foreground outline-none placeholder:text-muted-foreground font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="px-3.5 text-foreground hover:bg-foreground hover:text-background transition-colors self-stretch flex items-center"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </motion.div>

            <motion.button
              type="submit"
              disabled={!!loading}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...fieldTransition, delay: 0.15 }}
              className="brutal-press shadow-brutal flex w-full items-center justify-center gap-2 border-[3px] border-border-heavy bg-foreground py-2.5 font-bold uppercase tracking-wide text-background disabled:opacity-60"
            >
              {loading === "credentials" ? (
                <>
                  <span className="h-4 w-4 border-2 border-background/30 border-t-background animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </motion.button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-0.5 flex-1 bg-border-heavy" />
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              or continue with
            </span>
            <div className="h-0.5 flex-1 bg-border-heavy" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={!!loading}
              className="brutal-press shadow-brutal-sm flex items-center justify-center gap-2 border-[3px] border-border-heavy bg-card py-2.5 text-sm font-bold text-foreground disabled:opacity-60"
            >
              {loading === "google" ? <span className="h-4 w-4 border-2 border-foreground/25 border-t-foreground animate-spin" /> : <GoogleIcon />}
              Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuth("github")}
              disabled={!!loading}
              className="brutal-press shadow-brutal-sm flex items-center justify-center gap-2 border-[3px] border-border-heavy bg-foreground py-2.5 text-sm font-bold text-background disabled:opacity-60"
            >
              {loading === "github" ? <span className="h-4 w-4 border-2 border-background/30 border-t-background animate-spin" /> : <GitHubIcon />}
              GitHub
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
