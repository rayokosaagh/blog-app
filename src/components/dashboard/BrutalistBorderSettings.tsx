"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Square, RotateCcw, Sun, Moon } from "lucide-react";
import { isValidHex, normalizeHex } from "@/lib/color";
import {
  BRUTALIST_BORDER_DEFAULT,
  BRUTALIST_DARK_SHADOW_DEFAULT,
  BRUTALIST_LIGHT_BORDER_DEFAULT,
  SHADOW_BLUR_MIN,
  SHADOW_BLUR_MAX,
  type BrutalistBorder,
  type BorderColors,
} from "@/lib/brutalistBorder";
import {
  usePreviewEditor,
  PreviewEditPopover,
  TARGET_CLASS,
} from "@/components/dashboard/PreviewEditor";

type Scheme = "light" | "dark";

/**
 * Neo-Brutalist outline + offset-shadow editor. Only mounted while the
 * brutalist theme is selected — modern has no heavy outline or offset block.
 *
 * Colours are nullable: null follows the theme (light's shadow tracks its
 * outline, dark's outline tracks the dark-surface border), so the pickers show
 * the *effective* colour and label it "Default" until the admin picks one.
 */
export default function BrutalistBorderSettings({
  value,
  saved,
  darkBorderDefault,
  darkBackground,
  onChange,
  onSaved,
  onError,
}: {
  value: BrutalistBorder;
  saved: BrutalistBorder;
  /** Dark outline derived from the saved dark surfaces (darkSurfaceVars). */
  darkBorderDefault: string;
  darkBackground: string;
  onChange: (next: BrutalistBorder) => void;
  onSaved: (next: BrutalistBorder) => void;
  onError: (message: string | null) => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [scheme, setScheme] = useState<Scheme>("light");
  const { containerRef, editing, close, target } = usePreviewEditor<"card" | "button">();

  const dirty = JSON.stringify(value) !== JSON.stringify(saved);
  const isDefault = JSON.stringify(value) === JSON.stringify(BRUTALIST_BORDER_DEFAULT);

  const colors = value[scheme];
  const borderDefault = scheme === "light" ? BRUTALIST_LIGHT_BORDER_DEFAULT : darkBorderDefault;
  const border = colors.border ?? borderDefault;
  const shadowDefault = scheme === "light" ? border : BRUTALIST_DARK_SHADOW_DEFAULT;
  const shadow = colors.shadow ?? shadowDefault;

  function setColor(key: keyof BorderColors, next: string | null) {
    onChange({ ...value, [scheme]: { ...value[scheme], [key]: next } });
  }

  async function save() {
    setSaving(true);
    onError(null);
    try {
      const res = await fetch("/api/settings/ui", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brutalistBorder: value }),
      });
      if (!res.ok) throw new Error("save failed");
      // Show what the server stored — it clamps the blur.
      const data = await res.json();
      const stored: BrutalistBorder = data?.brutalistBorder ?? value;
      onChange(stored);
      onSaved(stored);
      router.refresh();
    } catch {
      onError("Couldn't save the border settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // The colour rows + blur slider, shared by the panel and the preview's
  // click-to-edit popover. A render helper, not a component, so the inputs
  // keep focus across keystrokes. `idSuffix` keeps the slider ids unique.
  const controls = (idSuffix: string) => (
    <>
      <div className="space-y-3">
        <ColorRow
          label="Border color"
          hint="Outline on cards, buttons and inputs"
          value={border}
          isDefault={colors.border === null}
          onChange={(c) => setColor("border", c)}
          onReset={() => setColor("border", null)}
        />
        <ColorRow
          label="Shadow color"
          hint={
            scheme === "light"
              ? "Offset block — follows the border by default"
              : "Offset block behind cards and buttons"
          }
          value={shadow}
          isDefault={colors.shadow === null}
          onChange={(c) => setColor("shadow", c)}
          onReset={() => setColor("shadow", null)}
        />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <label
            htmlFor={`shadow-blur-${idSuffix}`}
            className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Shadow blur
          </label>
          <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
            {value.blur === 0 ? "0px · hard" : `${value.blur}px`}
          </span>
        </div>
        <input
          id={`shadow-blur-${idSuffix}`}
          type="range"
          min={SHADOW_BLUR_MIN}
          max={SHADOW_BLUR_MAX}
          step={1}
          value={value.blur}
          onChange={(e) => onChange({ ...value, blur: Number(e.target.value) })}
          className="mt-2 w-full accent-zinc-900 dark:accent-zinc-100"
        />
        <p className="mt-1 text-xs text-zinc-400">
          0 keeps the classic crisp block; higher values soften it.
        </p>
      </div>
    </>
  );

  const frame = {
    border: `3px solid ${border}`,
    boxShadow: `4px 4px ${value.blur}px 0 ${shadow}`,
  };

  return (
    <div className="mb-5 rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
          <Square className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Borders &amp; shadows
            </h2>
            <span className="shrink-0 rounded-full bg-zinc-500/10 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
              Neo-Brutalist
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            The outline on cards, buttons and inputs, and the offset block behind them.
            Light and dark keep their own colors; the shadow blur applies to both.
          </p>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div className="min-w-0">
              <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
                {(["light", "dark"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                  setScheme(s);
                  close();
                }}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
                      scheme === s
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    }`}
                  >
                    {s === "light" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                    {s}
                  </button>
                ))}
              </div>

              <div className="mt-4">{controls("panel")}</div>
            </div>

            {/* Unclipped wrapper so the click-to-edit popover can hang below. */}
            <div ref={containerRef} className="relative min-w-0 lg:self-start">
              <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Preview · click to edit
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                    Neo-Brutalist · {scheme}
                  </span>
                </div>
                <div
                  className="flex flex-wrap items-center gap-5 p-6"
                  style={{ backgroundColor: scheme === "light" ? "#ffffff" : darkBackground }}
                >
                  <div
                    {...target("card", "card outline and shadow")}
                    className={`w-44 p-3 ${TARGET_CLASS}`}
                    style={{
                      ...frame,
                      backgroundColor: scheme === "light" ? "#ffffff" : darkBackground,
                      color: scheme === "light" ? "#0e1116" : "#ffffff",
                    }}
                  >
                    <p className="text-sm font-extrabold">Card title</p>
                    <p className="mt-1 text-xs opacity-70">Outline and offset shadow.</p>
                  </div>
                  <span
                    {...target("button", "button outline and shadow")}
                    className={`inline-flex items-center px-3 py-2 text-xs font-extrabold uppercase tracking-wide ${TARGET_CLASS}`}
                    style={{
                      ...frame,
                      backgroundColor: scheme === "light" ? "#ffe500" : "#c6ff33",
                      color: "#000000",
                    }}
                  >
                    Button
                  </span>
                </div>
              </div>

              {editing && (
                // Card and button share one border + shadow, so both open the
                // same controls; only the title says what was clicked.
                <PreviewEditPopover
                  anchor={editing.anchor}
                  title={`${editing.key === "card" ? "Card" : "Button"} outline & shadow · ${scheme}`}
                  hint="Applies to every Neo-Brutalist card, button and input."
                  width={340}
                  onClose={close}
                >
                  {controls("popover")}
                </PreviewEditPopover>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {saving ? "Saving…" : dirty ? "Save borders" : "Saved"}
            </button>
            <button
              type="button"
              onClick={() => onChange(BRUTALIST_BORDER_DEFAULT)}
              disabled={saving || isDefault}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-800 disabled:opacity-40 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to default
            </button>
            {dirty && (
              <span className="text-xs text-amber-600 dark:text-amber-400">Unsaved changes</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorRow({
  label,
  hint,
  value,
  isDefault,
  onChange,
  onReset,
}: {
  label: string;
  hint: string;
  value: string;
  isDefault: boolean;
  onChange: (hex: string) => void;
  onReset: () => void;
}) {
  // The text field keeps its own draft so a half-typed hex doesn't get
  // committed (and coerced back to "default" on save). It re-syncs whenever
  // the effective colour changes from outside — picker, reset, scheme switch.
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setDraft(value);
  }
  const valid = isValidHex(draft);

  return (
    <div className="flex items-center gap-3">
      <label
        className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700"
        style={{ backgroundColor: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(normalizeHex(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={label}
        />
      </label>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
          {isDefault ? (
            <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Default
            </span>
          ) : (
            <button
              type="button"
              onClick={onReset}
              className="text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Use default
            </button>
          )}
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      </div>
      <input
        type="text"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          if (isValidHex(e.target.value)) onChange(normalizeHex(e.target.value));
        }}
        onBlur={() => setDraft(value)}
        spellCheck={false}
        aria-label={`${label} hex`}
        className={`w-28 rounded-lg border bg-transparent px-2.5 py-1.5 font-mono text-xs uppercase text-zinc-900 outline-none dark:text-zinc-100 ${
          valid
            ? "border-zinc-200 focus:border-zinc-400 dark:border-zinc-700 dark:focus:border-zinc-500"
            : "border-red-400 focus:border-red-500"
        }`}
      />
    </div>
  );
}
