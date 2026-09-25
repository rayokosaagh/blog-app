"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CaseSensitive, CheckCircle2, Globe, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import Modal from "@/components/dashboard/Modal";
import { FontAssets } from "@/components/dashboard/FontLibraryContext";
import {
  FONT_FALLBACKS,
  MAX_FONTS,
  NAME_MAX,
  customFontsFrom,
  customStack,
  customWeights,
  newFontId,
  refOf,
  type CustomFont,
  type CustomFontFile,
  type FontFallback,
  type UploadedFont,
} from "@/lib/fontLibrary";
import { HEADING_ROLES, HEADING_ROLE_LABELS } from "@/lib/typography";
import { ARTICLE_HEADINGS, ARTICLE_HEADING_LABELS } from "@/lib/articleType";
import type { ArticleTypeByTheme, BodyFontByTheme, HeadingTypeByTheme } from "@/lib/settings";

type Usage = { headingType: HeadingTypeByTheme; articleType: ArticleTypeByTheme; bodyFont: BodyFontByTheme };

const ALL_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const SAMPLE = "The quick brown fox jumps over the lazy dog · Aa 123";
const inputCls =
  "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
const labelCls = "block text-xs font-medium text-zinc-500 dark:text-zinc-400";

/** Where a font is used, from the SAVED settings (what the site renders). */
function usageOf(ref: string, u: Usage): string[] {
  const out: string[] = [];
  for (const theme of ["brutalist", "modern"] as const) {
    const t = theme === "modern" ? "Modern" : "Neo-Brutalist";
    if (u.bodyFont[theme] === ref) out.push(`Site font · ${t}`);
    for (const role of HEADING_ROLES) {
      if (u.headingType[theme][role].font === ref) out.push(`${HEADING_ROLE_LABELS[role]} · ${t}`);
    }
    if (u.articleType[theme].body.font === ref) out.push(`Article font · ${t}`);
    for (const h of ARTICLE_HEADINGS) {
      if (u.articleType[theme].headings[h]?.font === ref) out.push(`Article ${ARTICLE_HEADING_LABELS[h]} · ${t}`);
    }
  }
  return out;
}

/**
 * Appearance → Fonts: the custom font library. Every add/edit/delete saves at
 * once (PUT customFonts), so uploaded files and the saved list never drift
 * apart — the server deletes files a save drops, and the dialog deletes
 * uploads it discards.
 */
export default function FontLibrarySettings({
  value,
  usage,
  onSaved,
  onError,
}: {
  value: CustomFont[];
  usage: Usage;
  onSaved: (next: CustomFont[], message: string) => void;
  onError: (message: string | null) => void;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<{ draft: CustomFont; isNew: boolean } | null>(null);
  const [deleting, setDeleting] = useState<CustomFont | null>(null);
  const [busy, setBusy] = useState(false);

  async function persist(next: CustomFont[], message: string): Promise<boolean> {
    setBusy(true);
    onError(null);
    try {
      const res = await fetch("/api/settings/ui", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customFonts: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save the font library.");
      onSaved(data.customFonts ?? next, message);
      router.refresh();
      return true;
    } catch (e) {
      onError(e instanceof Error ? e.message : "Couldn't save the font library.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const blankUpload = (): UploadedFont => ({ id: newFontId(), name: "", fallback: "sans-serif", source: "upload", files: [] });
  const deletingUsage = deleting ? usageOf(refOf(deleting), usage) : [];

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
          <CaseSensitive className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Custom fonts</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Add your own fonts, then pick them in Typography. Upload only fonts you&apos;re licensed to use on
                the web.
              </p>
            </div>
            <button
              type="button"
              disabled={value.length >= MAX_FONTS || busy}
              onClick={() => setDialog({ draft: blankUpload(), isNew: true })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              <Plus className="h-4 w-4" /> Add font
            </button>
          </div>

          {value.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
              No custom fonts yet.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {value.map((font) => {
                const used = usageOf(refOf(font), usage);
                return (
                  <li key={font.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{font.name}</span>
                        <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {font.source === "upload" ? "Uploaded" : "Google"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${font.name}`}
                          onClick={() => setDialog({ draft: structuredClone(font), isNew: false })}
                          className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${font.name}`}
                          onClick={() => setDeleting(font)}
                          className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-rose-600 dark:hover:bg-zinc-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p
                      className="heading-preview mt-2 truncate text-xl text-zinc-900 dark:text-zinc-100"
                      style={{ ["--preview-font" as string]: customStack(font) }}
                    >
                      {SAMPLE}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {customWeights(font).map((w) => (
                        <span
                          key={w}
                          className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {used.length ? `Used by: ${used.join(", ")}` : "Not used yet"}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {dialog && (
        <FontDialog
          initial={dialog.draft}
          isNew={dialog.isNew}
          busy={busy}
          onClose={() => setDialog(null)}
          onDone={async (font) => {
            const next = dialog.isNew ? [...value, font] : value.map((f) => (f.id === font.id ? font : f));
            const saved = await persist(next, dialog.isNew ? `${font.name} added` : `${font.name} updated`);
            if (saved) setDialog(null);
            return saved;
          }}
        />
      )}

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title={deleting ? `Delete ${deleting.name}?` : ""}>
        {deletingUsage.length ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-300">
            <p>It&apos;s used by these settings, which will fall back to their default font:</p>
            <ul className="mt-2 list-disc pl-5">
              {deletingUsage.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">It isn&apos;t used anywhere.</p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (!deleting) return;
              if (await persist(value.filter((f) => f.id !== deleting.id), `${deleting.name} deleted`)) setDeleting(null);
            }}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setDeleting(null)}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}

/**
 * Add/edit one font. Files uploaded here and not kept (Cancel, removed from
 * the list, or dropped by switching source) are deleted straight away, so
 * abandoned uploads don't pile up in uploads/fonts.
 */
function FontDialog({
  initial,
  isNew,
  busy,
  onClose,
  onDone,
}: {
  initial: CustomFont;
  isNew: boolean;
  busy: boolean;
  onClose: () => void;
  /** Saves the library; resolves true once saved. */
  onDone: (font: CustomFont) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<CustomFont>(initial);
  const [uploadedHere, setUploadedHere] = useState<string[]>([]);
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleOk, setGoogleOk] = useState<boolean>(!isNew && initial.source === "google");
  const [checking, setChecking] = useState(false);

  const discard = (urls: string[]) =>
    Promise.all(urls.map((u) => fetch(`/api/fonts?url=${encodeURIComponent(u)}`, { method: "DELETE" }).catch(() => null)));

  async function cancel() {
    await discard(uploadedHere);
    onClose();
  }

  function switchSource(source: "upload" | "google") {
    if (draft.source === source) return;
    void discard(uploadedHere);
    setUploadedHere([]);
    setGoogleOk(false);
    setError(null);
    setDraft(
      source === "upload"
        ? { id: draft.id, name: draft.name, fallback: draft.fallback, source: "upload", files: [] }
        : { id: draft.id, name: draft.name, fallback: draft.fallback, source: "google", family: "", weights: [400], italic: false },
    );
  }

  async function upload(files: FileList) {
    if (draft.source !== "upload") return;
    setUploading(true);
    setError(null);
    const added: CustomFontFile[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/fonts", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(`${file.name}: ${data.error || "upload failed"}`);
        continue;
      }
      added.push({ url: data.url, format: data.format, weight: data.variable ? [100, 900] : data.weight, style: data.style });
      setUploadedHere((u) => [...u, data.url]);
      setFileNames((n) => ({ ...n, [data.url]: data.fileName }));
    }
    // A blank name defaults to the first file's family part ("Inter-Bold.woff2" → "Inter").
    const guessedName = files[0]?.name
      .replace(/\.[^.]+$/, "")
      .replace(/[-_ ]?(thin|extra|ultra|light|regular|medium|semi|demi|bold|black|heavy|italic|variable|\[wght\]).*$/i, "");
    setDraft((d) => (d.source === "upload" ? { ...d, name: d.name || guessedName || "", files: [...d.files, ...added] } : d));
    setUploading(false);
  }

  function removeFile(url: string) {
    if (draft.source !== "upload") return;
    if (uploadedHere.includes(url)) {
      void discard([url]);
      setUploadedHere((u) => u.filter((x) => x !== url));
    }
    setDraft({ ...draft, files: draft.files.filter((f) => f.url !== url) });
  }

  function setFile(url: string, patch: Partial<CustomFontFile>) {
    if (draft.source !== "upload") return;
    setDraft({ ...draft, files: draft.files.map((f) => (f.url === url ? { ...f, ...patch } : f)) });
  }

  async function checkGoogle() {
    if (draft.source !== "google") return;
    setChecking(true);
    setError(null);
    const q = new URLSearchParams({ family: draft.family, weights: draft.weights.join(","), italic: draft.italic ? "1" : "0" });
    const res = await fetch(`/api/fonts/google-check?${q}`);
    const data = await res.json().catch(() => ({}));
    const ok = res.ok && data.ok === true;
    setGoogleOk(ok);
    if (!ok) setError(data.error || "Couldn't check that font.");
    setChecking(false);
  }

  async function done() {
    const check = customFontsFrom([draft]);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    if (draft.source === "google" && !googleOk) {
      setError("Check the font on Google first.");
      return;
    }
    // Only a SUCCESSFUL save takes ownership of this dialog's uploads. If it
    // fails, the dialog stays open still owning them, so Cancel cleans up.
    if (await onDone(check.fonts[0])) setUploadedHere([]);
  }

  const showPreview = draft.source === "upload" ? draft.files.length > 0 : googleOk;

  return (
    // Not dismissable mid-upload or mid-save: closing then would orphan the
    // files still arriving (cancel() can only discard uploads that finished).
    <Modal
      open
      // The corner × calls onClose regardless of `dismissable`, so guard here too.
      onClose={() => {
        if (!uploading && !busy) void cancel();
      }}
      dismissable={!uploading && !busy}
      title={isNew ? "Add font" : `Edit ${initial.name}`}
    >
      <FontAssets fonts={showPreview ? [draft] : []} />
      {isNew && (
        <div role="tablist" aria-label="Font source" className="mb-4 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          {(
            [
              ["upload", "Upload files", Upload],
              ["google", "Google Fonts", Globe],
            ] as const
          ).map(([src, label, Icon]) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={draft.source === src}
              onClick={() => switchSource(src)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition ${
                draft.source === src ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100" : "text-zinc-500"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="font-name" className={labelCls}>
              Font name
            </label>
            <input
              id="font-name"
              maxLength={NAME_MAX}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="font-fallback" className={labelCls}>
              Fallback
            </label>
            <select
              id="font-fallback"
              value={draft.fallback}
              onChange={(e) => setDraft({ ...draft, fallback: e.target.value as FontFallback })}
              className={inputCls}
            >
              {FONT_FALLBACKS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        {draft.source === "upload" ? (
          <div>
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-zinc-300 p-5 text-center text-sm text-zinc-500 transition hover:border-zinc-400 dark:border-zinc-700">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              <span>{uploading ? "Uploading…" : "Choose .woff2, .woff, .ttf or .otf files (5 MB max each)"}</span>
              <input
                type="file"
                multiple
                accept=".woff2,.woff,.ttf,.otf"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  if (e.target.files?.length) void upload(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {draft.files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {draft.files.map((f) => (
                  <li key={f.url} className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 p-2 text-xs dark:border-zinc-800">
                    <span className="min-w-0 flex-1 truncate text-zinc-700 dark:text-zinc-300">
                      {fileNames[f.url] ?? f.url.split("/").pop()}
                    </span>
                    <select
                      aria-label="Weight"
                      value={Array.isArray(f.weight) ? "variable" : f.weight}
                      onChange={(e) =>
                        setFile(f.url, { weight: e.target.value === "variable" ? [100, 900] : Number(e.target.value) })
                      }
                      className="rounded border border-zinc-200 bg-white px-1.5 py-1 dark:border-zinc-700 dark:bg-zinc-950"
                    >
                      {ALL_WEIGHTS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                      <option value="variable">Variable 100–900</option>
                    </select>
                    <select
                      aria-label="Style"
                      value={f.style}
                      onChange={(e) => setFile(f.url, { style: e.target.value as CustomFontFile["style"] })}
                      className="rounded border border-zinc-200 bg-white px-1.5 py-1 dark:border-zinc-700 dark:bg-zinc-950"
                    >
                      <option value="normal">Normal</option>
                      <option value="italic">Italic</option>
                    </select>
                    <button
                      type="button"
                      aria-label="Remove file"
                      onClick={() => removeFile(f.url)}
                      className="rounded p-1 text-zinc-400 transition hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="google-family" className={labelCls}>
                Google family
              </label>
              <input
                id="google-family"
                placeholder="e.g. Poppins"
                value={draft.family}
                onChange={(e) => {
                  setGoogleOk(false);
                  setDraft({ ...draft, family: e.target.value });
                }}
                className={inputCls}
              />
            </div>
            <fieldset>
              <legend className={labelCls}>Weights</legend>
              <div className="mt-1 flex flex-wrap gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                {ALL_WEIGHTS.map((w) => (
                  <label key={w} className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={draft.weights.includes(w)}
                      onChange={(e) => {
                        setGoogleOk(false);
                        setDraft({
                          ...draft,
                          weights: e.target.checked
                            ? [...draft.weights, w].sort((a, b) => a - b)
                            : draft.weights.filter((x) => x !== w),
                        });
                      }}
                    />
                    {w}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={draft.italic}
                onChange={(e) => {
                  setGoogleOk(false);
                  setDraft({ ...draft, italic: e.target.checked });
                }}
              />
              Include italics
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={checkGoogle}
                disabled={checking || !draft.family.trim()}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {checking ? "Checking…" : "Check & preview"}
              </button>
              {googleOk && (
                <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Found on Google Fonts
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">Google fonts make visitors&apos; browsers contact Google. Uploaded fonts don&apos;t.</p>
          </div>
        )}

        {showPreview && (
          <p
            className="heading-preview rounded-lg bg-zinc-50 p-3 text-lg text-zinc-900 dark:bg-zinc-800/50 dark:text-zinc-100"
            style={{ ["--preview-font" as string]: customStack(draft) }}
          >
            {SAMPLE}
          </p>
        )}

        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={done}
            disabled={busy || uploading}
            className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {busy ? "Saving…" : isNew ? "Add to library" : "Save font"}
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={uploading || busy}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
