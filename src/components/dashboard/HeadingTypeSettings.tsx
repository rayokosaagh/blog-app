"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Type, RotateCcw } from "lucide-react";
import type { UiTheme } from "@/lib/settings";
import {
  HEADING_ROLES,
  HEADING_ROLE_LABELS,
  HEADING_ROLE_HINTS,
  HEADING_FONTS,
  HEADING_FONT_LABELS,
  HEADING_FONT_STACKS,
  HEADING_FONT_WEIGHTS,
  headingDefault,
  sizeExpression,
  SIZE_MIN,
  SIZE_MAX,
  TRACKING_MIN,
  TRACKING_MAX,
  type HeadingRole,
  type HeadingStyle,
  type HeadingType,
  type HeadingFont,
} from "@/lib/typography";

/**
 * Heading typography editor — one panel per theme, mirroring how the accent
 * and dark-surface editors are bound to whichever theme is selected above.
 *
 * The preview renders with the role's real resolved values (including the
 * clamp()), so what an admin sees here is what the site renders, not an
 * approximation. It deliberately does NOT preview at the site's width — a
 * fluid heading is a range, so the preview is honest about only showing one
 * point on it, and the min/max fields carry the ends.
 */
export default function HeadingTypeSettings({
  theme,
  value,
  saved,
  onChange,
  onSaved,
  onError,
}: {
  theme: UiTheme;
  value: HeadingType;
  saved: HeadingType;
  onChange: (next: HeadingType) => void;
  onSaved: (next: HeadingType) => void;
  onError: (message: string | null) => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [openRole, setOpenRole] = useState<HeadingRole | null>("display");

  const defaults = headingDefault(theme);
  const dirty = JSON.stringify(value) !== JSON.stringify(saved);

  function setRole(role: HeadingRole, patch: Partial<HeadingStyle>) {
    const next = { ...value[role], ...patch };
    // Changing face can strand the weight on a step the new face can't render
    // (Bebas Neue has only 400), so snap it the same way the server does.
    if (patch.font) {
      const allowed = HEADING_FONT_WEIGHTS[patch.font];
      next.weight = allowed.reduce((best, w) =>
        Math.abs(w - next.weight) < Math.abs(best - next.weight) ? w : best,
      );
    }
    onChange({ ...value, [role]: next });
  }

  async function save() {
    setSaving(true);
    onError(null);
    try {
      const res = await fetch("/api/settings/ui", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headingType: { [theme]: value } }),
      });
      if (!res.ok) throw new Error("save failed");
      // Read back what the server actually stored — it clamps and snaps, so
      // the form should show the persisted truth rather than what was typed.
      const data = await res.json();
      const stored: HeadingType = data?.headingType?.[theme] ?? value;
      onChange(stored);
      onSaved(stored);
      router.refresh();
    } catch {
      onError("Couldn't save the heading styles. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
          <Type className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Heading styles
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Set the size and style of each kind of heading across the site. Every
            heading of a given kind uses the same values, so the site stays
            consistent. These apply to the{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {theme === "modern" ? "Modern & Clean" : "Neo-Brutalist"}
            </span>{" "}
            theme only.
          </p>

          <div className="mt-4 space-y-2">
            {HEADING_ROLES.map((role) => {
              const style = value[role];
              const isOpen = openRole === role;
              const changed =
                JSON.stringify(style) !== JSON.stringify(defaults[role]);
              return (
                <div
                  key={role}
                  className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700"
                >
                  <button
                    type="button"
                    onClick={() => setOpenRole(isOpen ? null : role)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {HEADING_ROLE_LABELS[role]}
                        </span>
                        {changed && (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                            Custom
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                        {HEADING_ROLE_HINTS[role]}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-zinc-400">
                      {style.minSize === style.maxSize
                        ? `${style.minSize}rem`
                        : `${style.minSize}–${style.maxSize}rem`}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-700">
                      <Preview role={role} style={style} />

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <NumberField
                          label="Min size"
                          suffix="rem"
                          hint="At narrow viewports"
                          value={style.minSize}
                          min={SIZE_MIN}
                          max={SIZE_MAX}
                          step={0.0625}
                          onChange={(minSize) => setRole(role, { minSize })}
                        />
                        <NumberField
                          label="Max size"
                          suffix="rem"
                          hint="At wide viewports"
                          value={style.maxSize}
                          min={SIZE_MIN}
                          max={SIZE_MAX}
                          step={0.0625}
                          onChange={(maxSize) => setRole(role, { maxSize })}
                        />

                        <div>
                          <FieldLabel>Font</FieldLabel>
                          <select
                            value={style.font}
                            onChange={(e) =>
                              setRole(role, { font: e.target.value as HeadingFont })
                            }
                            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                          >
                            {HEADING_FONTS.map((f) => (
                              <option key={f} value={f}>
                                {HEADING_FONT_LABELS[f]}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <FieldLabel>Weight</FieldLabel>
                          <select
                            value={style.weight}
                            onChange={(e) =>
                              setRole(role, { weight: Number(e.target.value) })
                            }
                            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                          >
                            {HEADING_FONT_WEIGHTS[style.font].map((w) => (
                              <option key={w} value={w}>
                                {w}
                              </option>
                            ))}
                          </select>
                          {/* Bebas Neue ships one weight; saying so beats
                              offering steps the browser would only fake. */}
                          {HEADING_FONT_WEIGHTS[style.font].length === 1 && (
                            <p className="mt-1 text-xs text-zinc-400">
                              {HEADING_FONT_LABELS[style.font]} has only one weight.
                            </p>
                          )}
                        </div>

                        <NumberField
                          label="Letter spacing"
                          suffix="em"
                          hint="Negative tightens"
                          value={style.tracking}
                          min={TRACKING_MIN}
                          max={TRACKING_MAX}
                          step={0.005}
                          onChange={(tracking) => setRole(role, { tracking })}
                        />

                        <label className="flex cursor-pointer items-center gap-2.5 self-end pb-2">
                          <input
                            type="checkbox"
                            checked={style.uppercase}
                            onChange={(e) =>
                              setRole(role, { uppercase: e.target.checked })
                            }
                            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                          />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            Uppercase
                          </span>
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => onChange({ ...value, [role]: defaults[role] })}
                        disabled={!changed}
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-800 disabled:opacity-40 dark:text-zinc-400 dark:hover:text-zinc-200"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset this heading
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {saving ? "Saving…" : "Save heading styles"}
            </button>
            <button
              type="button"
              onClick={() => onChange(defaults)}
              className="text-xs font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Reset all to defaults
            </button>
            {dirty && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Unsaved changes
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{children}</span>
  );
}

function NumberField({
  label,
  hint,
  suffix,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  hint?: string;
  suffix: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = Number(e.target.value);
            // An empty or half-typed field parses as NaN; ignoring it keeps the
            // last good value rather than writing NaN into the blob.
            if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
          }}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm tabular-nums text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <span className="text-xs text-zinc-400">{suffix}</span>
      </div>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

const SAMPLE: Record<HeadingRole, string> = {
  display: "Tech news, reviewed",
  pageTitle: "Latest posts",
  section: "Review overview",
  card: "Xiaomi 17T Review",
  eyebrow: "Scored & tested",
};

function Preview({ role, style }: { role: HeadingRole; style: HeadingStyle }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-5 dark:border-zinc-700 dark:bg-zinc-950">
      <p
        // Inline so the preview uses the same resolved values the site will —
        // including the clamp(), so it scales with the panel exactly as the
        // real heading scales with the page.
        style={{
          fontSize: sizeExpression(style),
          fontWeight: style.weight,
          letterSpacing: `${style.tracking}em`,
          textTransform: style.uppercase ? "uppercase" : "none",
          // Not fontFamily directly: the global `html body *` rule forces
          // --font-sans with !important, so the face is handed over as a
          // custom property that .heading-preview reads back with the same
          // weight. Setting it inline here would simply be ignored.
          ["--preview-font" as string]: HEADING_FONT_STACKS[style.font],
          lineHeight: 1.1,
          margin: 0,
          color: "inherit",
        } as React.CSSProperties}
        className="heading-preview truncate text-zinc-900 dark:text-zinc-100"
      >
        {SAMPLE[role]}
      </p>
    </div>
  );
}
