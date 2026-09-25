"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, RotateCcw } from "lucide-react";
import type { UiTheme } from "@/lib/settings";
import { RoleFields, NumberField, FieldLabel, headingCss } from "@/components/dashboard/HeadingTypeSettings";
import { FontOptions, useFontLibrary } from "@/components/dashboard/FontLibraryContext";
import type { CustomFont } from "@/lib/fontLibrary";
import {
  fontStack,
  fontWeights,
  HEADING_ROLE_LABELS,
  type HeadingStyle,
  type HeadingType,
} from "@/lib/typography";
import {
  ARTICLE_HEADINGS,
  ARTICLE_HEADING_LABELS,
  ARTICLE_HEADING_HINTS,
  ARTICLE_HEADING_FOLLOWS,
  ARTICLE_BODY_FONTS,
  ARTICLE_TYPE_DEFAULT,
  BODY_SIZE_DEFAULT,
  BODY_LEADING_DEFAULT,
  BODY_SIZE_MIN,
  BODY_SIZE_MAX,
  BODY_LEADING_MIN,
  BODY_LEADING_MAX,
  followedStyle,
  type ArticleBody,
  type ArticleHeading,
  type ArticleType,
} from "@/lib/articleType";

/**
 * Blog post typography — the body text and each heading level of an article,
 * for the theme selected above. Sits under Heading styles because it builds on
 * them: every heading level follows its site role until switched to its own
 * style, and the switch starts from exactly what that role renders today.
 */
export default function ArticleTypeSettings({
  theme,
  value,
  saved,
  siteType,
  onChange,
  onSaved,
  onError,
}: {
  theme: UiTheme;
  value: ArticleType;
  saved: ArticleType;
  /** This theme's site heading styles, as currently edited above. */
  siteType: HeadingType;
  onChange: (next: ArticleType) => void;
  onSaved: (next: ArticleType) => void;
  onError: (message: string | null) => void;
}) {
  const router = useRouter();
  const library = useFontLibrary();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<ArticleHeading | null>(null);

  const dirty = JSON.stringify(value) !== JSON.stringify(saved);
  const isDefault = JSON.stringify(value) === JSON.stringify(ARTICLE_TYPE_DEFAULT);

  const setBody = (patch: Partial<ArticleBody>) => onChange({ ...value, body: { ...value.body, ...patch } });
  const setHeading = (h: ArticleHeading, next: HeadingStyle | null) =>
    onChange({ ...value, headings: { ...value.headings, [h]: next } });
  const effective = (h: ArticleHeading) => value.headings[h] ?? followedStyle(h, siteType);

  async function save() {
    setSaving(true);
    onError(null);
    try {
      const res = await fetch("/api/settings/ui", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleType: { [theme]: value } }),
      });
      if (!res.ok) throw new Error("save failed");
      // The server clamps sizes and snaps weights; show what it stored.
      const data = await res.json();
      const stored: ArticleType = data?.articleType?.[theme] ?? value;
      onChange(stored);
      onSaved(stored);
      router.refresh();
    } catch {
      onError("Couldn't save the article typography. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
          <FileText className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Article typography</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            The text and headings inside a blog post. Headings follow the site heading styles above
            until you give them their own. These apply to the{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {theme === "modern" ? "Modern & Clean" : "Neo-Brutalist"}
            </span>{" "}
            theme only.
          </p>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div className="min-w-0 lg:order-last lg:sticky lg:top-6 lg:self-start">
              <ArticlePreview body={value.body} effective={effective} active={open} onPick={setOpen} />
            </div>

            <div className="min-w-0 space-y-4">
              {/* Article text */}
              <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Article text</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Paragraphs, lists and tables in the article.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FieldLabel>Article font</FieldLabel>
                    <select
                      value={value.body.font}
                      onChange={(e) => setBody({ font: e.target.value as ArticleBody["font"] })}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                      <FontOptions builtIns={ARTICLE_BODY_FONTS} value={value.body.font} />
                    </select>
                    <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                      Leave on Theme default to use the site font.
                    </p>
                  </div>
                  <DefaultableNumber
                    label="Size"
                    suffix="rem"
                    value={value.body.size}
                    fallback={BODY_SIZE_DEFAULT}
                    min={BODY_SIZE_MIN}
                    max={BODY_SIZE_MAX}
                    step={0.0625}
                    onChange={(size) => setBody({ size })}
                  />
                  <DefaultableNumber
                    label="Line height"
                    suffix="×"
                    value={value.body.leading}
                    fallback={BODY_LEADING_DEFAULT}
                    min={BODY_LEADING_MIN}
                    max={BODY_LEADING_MAX}
                    step={0.05}
                    onChange={(leading) => setBody({ leading })}
                  />
                </div>
              </div>

              {/* Heading levels */}
              <div className="space-y-2">
                {ARTICLE_HEADINGS.map((h) => {
                  const custom = value.headings[h];
                  const isOpen = open === h;
                  const follows = HEADING_ROLE_LABELS[ARTICLE_HEADING_FOLLOWS[h].role];
                  return (
                    <div key={h} className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : h)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {ARTICLE_HEADING_LABELS[h]}
                            </span>
                            {custom && (
                              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                                Custom
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                            {ARTICLE_HEADING_HINTS[h]}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-zinc-400">{custom ? "Own style" : follows}</span>
                      </button>

                      {isOpen && (
                        <div className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-700">
                          <label className="flex cursor-pointer items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={!custom}
                              onChange={(e) => setHeading(h, e.target.checked ? null : followedStyle(h, siteType))}
                              className="mt-0.5 h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                            />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              Match the site&apos;s &ldquo;{follows}&rdquo; style
                              <span className="block text-xs text-zinc-400">
                                Changes to that heading style above carry over here.
                              </span>
                            </span>
                          </label>
                          {custom && (
                            <div className="mt-4">
                              <RoleFields style={custom} onPatch={(patch) => setHeading(h, withFont(custom, patch, library))} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {saving ? "Saving…" : "Save article typography"}
            </button>
            <button
              type="button"
              onClick={() => onChange(ARTICLE_TYPE_DEFAULT)}
              disabled={isDefault}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-800 disabled:opacity-40 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset all to defaults
            </button>
            {dirty && <span className="text-xs text-amber-600 dark:text-amber-400">Unsaved changes</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Same weight snapping as HeadingTypeSettings.setRole when the face changes. */
function withFont(style: HeadingStyle, patch: Partial<HeadingStyle>, library: readonly CustomFont[]): HeadingStyle {
  const next = { ...style, ...patch };
  if (patch.font) {
    const allowed = fontWeights(patch.font, library);
    next.weight = allowed.reduce((best, w) => (Math.abs(w - next.weight) < Math.abs(best - next.weight) ? w : best));
  }
  return next;
}

/**
 * A number field whose null means "the article's own default". Shows the
 * default value greyed with a note until edited, and a reset to go back.
 */
function DefaultableNumber({
  label,
  suffix,
  value,
  fallback,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  suffix: string;
  value: number | null;
  fallback: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number | null) => void;
}) {
  return (
    <div>
      <NumberField
        label={label}
        suffix={suffix}
        value={value ?? fallback}
        min={min}
        max={max}
        step={step}
        onChange={(n) => onChange(n)}
      />
      {value === null ? (
        <p className="mt-1 text-xs text-zinc-400">Default</p>
      ) : (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Use default ({fallback})
        </button>
      )}
    </div>
  );
}

/**
 * A short article rendered with the real resolved values — the same numbered
 * chips and hairline the post page draws — so an admin sees the levels
 * against each other and against the body text. Clicking a heading opens its
 * row in the list.
 */
function ArticlePreview({
  body,
  effective,
  active,
  onPick,
}: {
  body: ArticleBody;
  effective: (h: ArticleHeading) => HeadingStyle;
  active: ArticleHeading | null;
  onPick: (h: ArticleHeading) => void;
}) {
  const library = useFontLibrary();
  const bodyStyle = {
    ["--preview-font" as string]: fontStack(body.font, library),
    fontSize: `${body.size ?? BODY_SIZE_DEFAULT}rem`,
    lineHeight: body.leading ?? BODY_LEADING_DEFAULT,
  } as React.CSSProperties;

  const heading = (h: ArticleHeading, children: React.ReactNode, extra?: React.CSSProperties) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onPick(h)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onPick(h))}
      className={`heading-preview cursor-pointer rounded outline-offset-4 outline-amber-500 hover:outline-2 hover:outline-dashed ${
        active === h ? "outline-2 outline-dashed" : ""
      }`}
      style={{ ...headingCss(effective(h), library), ...extra }}
    >
      {children}
    </div>
  );

  const chip = "inline-flex shrink-0 items-center justify-center rounded-md border font-extrabold tabular-nums";

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
      <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
        Article preview · click a heading
      </div>
      <div className="space-y-3 bg-white p-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {heading(
          "kicker",
          <span className="flex items-center gap-3">
            <span className={`${chip} h-8 min-w-8 border-blue-300 bg-blue-50 px-1.5 text-sm tracking-normal text-blue-600 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-400`}>
              01
            </span>
            Overview
            <span className="h-px flex-1 bg-blue-200 dark:bg-blue-500/30" />
          </span>,
          { color: "rgb(37 99 235)" },
        )}
        {heading("title", "Design and build")}
        <p className="heading-preview text-zinc-600 dark:text-zinc-400" style={bodyStyle}>
          The flat aluminium frame is the first thing you notice. It sits flush in the hand, and the
          buttons have a firm, clicky travel.
        </p>
        {heading(
          "sub",
          <span className="flex items-baseline gap-2.5">
            <span className={`${chip} h-6 border-zinc-400 px-1.5 text-xs tracking-normal text-zinc-500 normal-case`}>1.1</span>
            Materials
          </span>,
        )}
        <ul className="heading-preview list-disc pl-6 text-zinc-600 dark:text-zinc-400" style={bodyStyle}>
          <li>Gorilla Glass Victus 2 on both sides</li>
          <li>IP68 dust and water resistance</li>
        </ul>
        {heading("minor", "Price in Nepal", { color: "rgb(37 99 235)" })}
        <p className="heading-preview text-zinc-600 dark:text-zinc-400" style={bodyStyle}>
          Rs 74,999 for the 12GB + 256GB model.
        </p>
      </div>
    </div>
  );
}
