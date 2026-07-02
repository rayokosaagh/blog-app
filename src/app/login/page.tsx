"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
    </svg>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7c2.1 0 3.9.66 5.4 1.6M22 12s-3.5 7-10 7c-2.1 0-3.9-.66-5.4-1.6" />
      <path d="M1 1l22 22" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-[#FAFAF8] px-4">
      {/* ambient background blobs */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#8E7CF0] opacity-20 blur-3xl"
        animate={prefersReducedMotion ? undefined : { x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-[#F5A623] to-[#F76B1C] opacity-15 blur-3xl"
        animate={prefersReducedMotion ? undefined : { x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50"
      >
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-7 flex flex-col items-center text-center"
        >
          <h1 className="text-2xl font-semibold text-[#1F2430]">Welcome back</h1>
          <p className="mt-1.5 text-sm text-[#6B7280]">Sign in to your blog dashboard</p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <motion.div
                animate={{ x: [0, -6, 6, -4, 4, 0] }}
                transition={{ duration: 0.4 }}
                className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v5M12 16h.01" />
                </svg>
                {error}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            <label className="mb-1.5 block text-sm font-medium text-[#1F2430]">Email</label>
            <div className="group relative flex items-center rounded-lg border border-gray-200 bg-white transition-colors focus-within:border-[#6C5CE7] focus-within:ring-2 focus-within:ring-[#6C5CE7]/20">
              <span className="pl-3.5 text-gray-400 group-focus-within:text-[#6C5CE7]">
                <MailIcon />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@blog.com"
                className="w-full bg-transparent px-3 py-2.5 text-[#1F2430] outline-none placeholder:text-gray-400"
                required
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <label className="mb-1.5 block text-sm font-medium text-[#1F2430]">Password</label>
            <div className="group relative flex items-center rounded-lg border border-gray-200 bg-white transition-colors focus-within:border-[#6C5CE7] focus-within:ring-2 focus-within:ring-[#6C5CE7]/20">
              <span className="pl-3.5 text-gray-400 group-focus-within:text-[#6C5CE7]">
                <LockIcon />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent px-3 py-2.5 text-[#1F2430] outline-none placeholder:text-gray-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="px-3.5 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>
          </motion.div>

          <motion.button
            type="submit"
            disabled={!!loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#12121B] py-2.5 font-medium text-white transition-colors hover:bg-[#1F1F2E] disabled:opacity-60"
          >
            {loading === "credentials" ? (
              <>
                <motion.span
                  className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </motion.button>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.34 }}
          className="my-6 flex items-center gap-3"
        >
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">or continue with</span>
          <div className="h-px flex-1 bg-gray-200" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-3"
        >
          <motion.button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={!!loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-[#1F2430] transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            {loading === "google" ? (
              <motion.span
                className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-600"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <GoogleIcon />
            )}
            Google
          </motion.button>

          <motion.button
            type="button"
            onClick={() => handleOAuth("github")}
            disabled={!!loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-800 bg-[#181717] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#242424] disabled:opacity-60"
          >
            {loading === "github" ? (
              <motion.span
                className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <GitHubIcon />
            )}
            GitHub
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}