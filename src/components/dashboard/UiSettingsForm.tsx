"use client";

import { useState } from "react";
import { Sparkles, AlertTriangle } from "lucide-react";
import { Toggle, SuccessToast } from "@/components/dashboard/DashboardUI";

export default function UiSettingsForm({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    if (saving) return;
    const next = !enabled;
    setEnabled(next); // optimistic
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/ui", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homepageAnimatedBackground: next }),
      });
      if (!res.ok) throw new Error("save failed");
      setToast(next ? "Animated background turned ON" : "Animated background turned OFF");
    } catch {
      setEnabled(!next); // revert on failure
      setError("Couldn't save the change. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
          style={{ fontFamily: "var(--font-display)" }}
        >
          UI
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Control front-end appearance and effects.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Setting card */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Homepage animated background
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                The moving neo-brutalist shapes that fly across the homepage
                behind the content. Turn this off for a plain, static backdrop.
              </p>
              <p className="mt-2 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                Status:{" "}
                <span className={enabled ? "text-emerald-500" : "text-zinc-400"}>
                  {enabled ? "On" : "Off"}
                </span>
                {saving && " · saving…"}
              </p>
            </div>
          </div>

          <Toggle checked={enabled} onChange={handleToggle} />
        </div>
      </div>

      {toast && <SuccessToast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
