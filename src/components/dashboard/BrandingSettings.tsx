"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, BadgeCheck, ImageUp, Loader2, Trash2 } from "lucide-react";
import type { Branding, BrandingField } from "@/lib/settings";

// What /api/upload accepts for images. SVG is deliberately absent: an SVG
// served from our own origin can run script when opened directly.
const ACCEPT = "image/png,image/webp,image/jpeg,image/gif";
const MAX_BYTES = 5 * 1024 * 1024;

const SLOTS: {
  field: BrandingField;
  label: string;
  hint: string;
  previewBg: string;
}[] = [
  {
    field: "logo",
    label: "Logo",
    hint: "Replaces the “Blog” text in the header, mobile menu and footer. A wide PNG or WebP with a transparent background, at least 80px tall, works best.",
    previewBg: "bg-white",
  },
  {
    field: "logoDark",
    label: "Dark-mode logo",
    hint: "Optional. Shown instead of the logo when the site is in dark mode — use a light-coloured version. Leave empty to use the main logo in both modes.",
    previewBg: "bg-zinc-900",
  },
  {
    field: "siteIcon",
    label: "Site icon",
    hint: "The browser-tab favicon and the home-screen / installed-app icon. Use a square PNG, 512×512 or larger.",
    previewBg: "bg-zinc-100 dark:bg-zinc-800",
  },
];

const sameBranding = (a: Branding, b: Branding) =>
  a.logo === b.logo && a.logoDark === b.logoDark && a.siteIcon === b.siteIcon;

export default function BrandingSettings({
  value,
  saved,
  onChange,
  onSaved,
  onError,
}: {
  value: Branding;
  saved: Branding;
  onChange: (next: Branding) => void;
  onSaved: (next: Branding) => void;
  onError: (message: string | null) => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<BrandingField | null>(null);
  const [notSquare, setNotSquare] = useState(false);
  const inputs = useRef<Partial<Record<BrandingField, HTMLInputElement | null>>>({});

  const dirty = !sameBranding(value, saved);

  async function upload(field: BrandingField, file: File) {
    if (!ACCEPT.split(",").includes(file.type)) {
      onError("Use a PNG, WebP, JPEG or GIF image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      onError("That image is over 5MB. Please use a smaller file.");
      return;
    }
    setUploading(field);
    onError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.url !== "string") {
        throw new Error(data.error || "Upload failed");
      }
      onChange({ ...value, [field]: data.url });
    } catch (e) {
      onError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setSaving(true);
    onError(null);
    try {
      const res = await fetch("/api/settings/ui", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branding: value }),
      });
      if (!res.ok) throw new Error("save failed");
      const data = await res.json();
      const stored: Branding = data?.branding ?? value;
      onChange(stored);
      onSaved(stored);
      router.refresh();
    } catch {
      onError("Couldn't save the branding. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
          <BadgeCheck className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Branding</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Your logo and site icon. Anything left empty falls back to the default
            “Blog” text and icons.
          </p>

          <div className="mt-5 space-y-4">
            {SLOTS.map(({ field, label, hint, previewBg }) => {
              const url = value[field];
              const busy = uploading === field;
              const isIcon = field === "siteIcon";
              return (
                <div
                  key={field}
                  className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-4 sm:flex-row sm:items-center dark:border-zinc-800"
                >
                  <div
                    className={`flex h-24 shrink-0 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 ${previewBg} ${
                      isIcon ? "w-24" : "w-full sm:w-56"
                    }`}
                  >
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt={`${label} preview`}
                        className={isIcon ? "h-16 w-16 object-contain" : "max-h-14 max-w-[85%] object-contain"}
                        onLoad={
                          isIcon
                            ? (e) =>
                                setNotSquare(
                                  e.currentTarget.naturalWidth !== e.currentTarget.naturalHeight,
                                )
                            : undefined
                        }
                      />
                    ) : (
                      <span
                        className={`text-xs font-medium ${
                          field === "logoDark" ? "text-zinc-500" : "text-zinc-400"
                        }`}
                      >
                        {field === "siteIcon" ? "Default" : "“Blog” text"}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
                    {isIcon && url && notSquare && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        This image isn&apos;t square, so browsers will squash or pad it.
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <input
                        ref={(el) => {
                          inputs.current[field] = el;
                        }}
                        type="file"
                        accept={ACCEPT}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          // Reset so choosing the same file again still fires.
                          e.target.value = "";
                          if (file) upload(field, file);
                        }}
                      />
                      <button
                        type="button"
                        disabled={busy || saving}
                        onClick={() => inputs.current[field]?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-600"
                      >
                        {busy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ImageUp className="h-3.5 w-3.5" />
                        )}
                        {busy ? "Uploading…" : url ? "Replace" : "Upload"}
                      </button>
                      {url && (
                        <button
                          type="button"
                          disabled={busy || saving}
                          onClick={() => onChange({ ...value, [field]: null })}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 transition hover:text-red-600 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving || uploading !== null}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {saving ? "Saving…" : dirty ? "Save branding" : "Saved"}
            </button>
            {dirty && (
              <button
                type="button"
                onClick={() => onChange(saved)}
                disabled={saving}
                className="text-xs font-medium text-zinc-500 transition hover:text-zinc-800 disabled:opacity-40 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Discard changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
