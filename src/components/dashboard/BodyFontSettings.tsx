"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlignLeft } from "lucide-react";
import { ARTICLE_BODY_FONTS } from "@/lib/articleType";
import { fontStack, type HeadingFont } from "@/lib/typography";
import type { UiTheme } from "@/lib/settings";
import { FontOptions, useFontLibrary } from "@/components/dashboard/FontLibraryContext";

/**
 * Site-wide body text font for one theme. It replaces that theme's base font
 * (--font-sans), so heading styles left on "Theme default" follow it too —
 * said in the hint, so nobody is surprised. Readable faces only: Bebas Neue is
 * excluded for body text, as in Article typography.
 */
export default function BodyFontSettings({
  theme,
  value,
  saved,
  onChange,
  onSaved,
  onError,
}: {
  theme: UiTheme;
  value: HeadingFont;
  saved: HeadingFont;
  onChange: (next: HeadingFont) => void;
  onSaved: (next: HeadingFont) => void;
  onError: (message: string | null) => void;
}) {
  const router = useRouter();
  const library = useFontLibrary();
  const [saving, setSaving] = useState(false);
  const dirty = value !== saved;

  async function save() {
    setSaving(true);
    onError(null);
    try {
      const res = await fetch("/api/settings/ui", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bodyFont: { [theme]: value } }),
      });
      if (!res.ok) throw new Error("save failed");
      onSaved(value);
      router.refresh();
    } catch {
      onError("Couldn't save the site font. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
          <AlignLeft className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Site font</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            The main font for the whole site: paragraphs, buttons and menus. Blog
            posts use it too, unless Article typography sets its own article font.
            Heading styles left on &ldquo;Theme default&rdquo; follow it as well.
          </p>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value as HeadingFont)}
            aria-label="Site font"
            className="mt-4 w-full max-w-sm rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <FontOptions builtIns={ARTICLE_BODY_FONTS} value={value} />
          </select>
          <p
            className="heading-preview mt-4 max-w-xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"
            style={{ ["--preview-font" as string]: fontStack(value, library) }}
          >
            The quick brown fox jumps over the lazy dog. Read the review, explore the specs and make your choice.
          </p>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {saving ? "Saving…" : dirty ? "Save site font" : "Saved"}
          </button>
        </div>
      </div>
    </div>
  );
}
