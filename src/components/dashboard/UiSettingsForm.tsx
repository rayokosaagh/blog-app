"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  AlertTriangle,
  Palette,
  Droplet,
  RotateCcw,
  Check,
  Sun,
  Moon,
} from "lucide-react";
import { Toggle, SuccessToast } from "@/components/dashboard/DashboardUI";
import type { UiTheme, ModernAccents, DarkSurfacesByTheme } from "@/lib/settings";
import {
  buildModernAccentVars,
  buildBrutalistAccentVars,
  deriveModernDark,
  darkSurfaceVars,
  BRUTALIST_DARK_SURFACES_DEFAULT,
  MODERN_DARK_SURFACES_DEFAULT,
  isValidHex,
  normalizeHex,
  MODERN_ACCENTS_DEFAULT,
  BRUTALIST_LIGHT_DEFAULT,
  BRUTALIST_DARK_DEFAULT,
  type AccentTrio,
  type ThemeAccents,
  type DarkSurfaces,
  type TokenSet,
} from "@/lib/color";

type Scheme = "light" | "dark";

const MODERN_PRESETS: { label: string; trio: AccentTrio }[] = [
  { label: "Deep purple", trio: MODERN_ACCENTS_DEFAULT },
  { label: "Purple + blue", trio: { accent: "#5b21b6", accent2: "#2563eb", accent3: "#7c3aed" } },
  { label: "Deeper purple", trio: { accent: "#4c1d95", accent2: "#7c3aed", accent3: "#a78bfa" } },
  { label: "Navy + blue", trio: { accent: "#1e3a8a", accent2: "#3b82f6", accent3: "#60a5fa" } },
  { label: "Emerald", trio: { accent: "#047857", accent2: "#10b981", accent3: "#34d399" } },
  { label: "Crimson", trio: { accent: "#9f1239", accent2: "#e11d48", accent3: "#fb7185" } },
];

// Modern dark presets — lighter, desaturated tints that hold up against the
// near-black modern surface, since the deep light-mode violets go muddy there.
const MODERN_DARK_PRESETS: { label: string; trio: AccentTrio }[] = [
  { label: "Soft violet", trio: deriveModernDark(MODERN_ACCENTS_DEFAULT) },
  { label: "Lilac", trio: { accent: "#c4b5fd", accent2: "#ddd6fe", accent3: "#ede9fe" } },
  { label: "Sky", trio: { accent: "#7dd3fc", accent2: "#a5f3fc", accent3: "#bae6fd" } },
  { label: "Mint", trio: { accent: "#6ee7b7", accent2: "#a7f3d0", accent3: "#5eead4" } },
  { label: "Peach", trio: { accent: "#fdba74", accent2: "#fcd34d", accent3: "#fda4af" } },
];

// Brutalist presets are per-scheme: light leans primary-bright, dark leans
// neon, matching how the theme's two palettes are designed.
const BRUTALIST_LIGHT_PRESETS: { label: string; trio: AccentTrio }[] = [
  { label: "Classic", trio: BRUTALIST_LIGHT_DEFAULT },
  { label: "Traffic", trio: { accent: "#e11d48", accent2: "#facc15", accent3: "#0ea5e9" } },
  { label: "Ink & lime", trio: { accent: "#111827", accent2: "#a3e635", accent3: "#f97316" } },
  { label: "Orange pop", trio: { accent: "#ea580c", accent2: "#fde047", accent3: "#7c3aed" } },
  { label: "Electric", trio: { accent: "#7c3aed", accent2: "#22d3ee", accent3: "#f43f5e" } },
];

const BRUTALIST_DARK_PRESETS: { label: string; trio: AccentTrio }[] = [
  { label: "Neon", trio: BRUTALIST_DARK_DEFAULT },
  { label: "Vapor", trio: { accent: "#ff2ec4", accent2: "#22d3ee", accent3: "#fde047" } },
  { label: "Toxic", trio: { accent: "#a3e635", accent2: "#f97316", accent3: "#38bdf8" } },
  { label: "Ice", trio: { accent: "#38bdf8", accent2: "#a5f3fc", accent3: "#c084fc" } },
  { label: "Ember", trio: { accent: "#fb923c", accent2: "#fbbf24", accent3: "#f43f5e" } },
];

// The four dark-mode base surfaces. Everything else in the dark palette
// (muted text, footer, heavy border) is derived from these — see
// darkSurfaceVars in lib/color.
const SURFACE_FIELDS: { key: keyof DarkSurfaces; label: string; hint: string }[] = [
  { key: "background", label: "Background", hint: "The page behind everything" },
  { key: "card", label: "Card surface", hint: "Panels, cards, dropdowns, footer" },
  { key: "border", label: "Border", hint: "Dividers and outlines" },
  { key: "foreground", label: "Text", hint: "Body copy and headings" },
];

const DARK_SURFACE_PRESETS: { label: string; value: DarkSurfaces }[] = [
  { label: "Charcoal", value: BRUTALIST_DARK_SURFACES_DEFAULT },
  { label: "Near black", value: MODERN_DARK_SURFACES_DEFAULT },
  {
    label: "True black",
    value: { background: "#000000", card: "#0c0c0c", border: "#242424", foreground: "#ffffff" },
  },
  {
    label: "Navy ink",
    value: { background: "#0b1220", card: "#111a2e", border: "#22304d", foreground: "#eef2ff" },
  },
  {
    label: "Warm gray",
    value: { background: "#14120f", card: "#1c1917", border: "#332f2b", foreground: "#faf9f7" },
  },
  {
    label: "Slate",
    value: { background: "#0f172a", card: "#1e293b", border: "#334155", foreground: "#f1f5f9" },
  },
];

const ACCENT_FIELDS: { key: keyof AccentTrio; label: string; hint: string }[] = [
  { key: "accent", label: "Primary", hint: "Buttons, links, prices, active tabs" },
  { key: "accent2", label: "Secondary", hint: "Hover highlights, badges, toggles" },
  { key: "accent3", label: "Tertiary", hint: "Category badges, icon chips" },
];

// Surface values mirroring globals.css, so the preview below renders in the
// real theme's framing (border weight, radius, shadow) rather than a generic
// swatch row. Duplicated here because those live in CSS, not in JS tokens —
// if the palettes in globals.css change, update these to match.
const SURFACES: Record<UiTheme, Record<Scheme, {
  bg: string; fg: string; muted: string; border: string;
  borderWidth: number; radius: number; pill: number; shadow: string;
}>> = {
  brutalist: {
    light: {
      bg: "#ffffff", fg: "#0e1116", muted: "#4b5566", border: "#000000",
      borderWidth: 3, radius: 0, pill: 0, shadow: "4px 4px 0 0 #000000",
    },
    dark: {
      bg: "#0f0f0f", fg: "#ffffff", muted: "#a3a3a3", border: "#3f3f3f",
      borderWidth: 3, radius: 0, pill: 0, shadow: "4px 4px 0 0 #bbbbbb",
    },
  },
  modern: {
    light: {
      bg: "#ffffff", fg: "#0e1116", muted: "#6b7280", border: "#e5e7eb",
      borderWidth: 1, radius: 16, pill: 9999,
      shadow: "0 4px 12px -2px rgba(16,24,40,0.08), 0 2px 4px -2px rgba(16,24,40,0.04)",
    },
    dark: {
      bg: "#131316", fg: "#ffffff", muted: "#9ca3af", border: "#232328",
      borderWidth: 1, radius: 16, pill: 9999,
      shadow: "0 4px 12px -2px rgba(0,0,0,0.5)",
    },
  },
};

function trioEqual(a: AccentTrio, b: AccentTrio) {
  return a.accent === b.accent && a.accent2 === b.accent2 && a.accent3 === b.accent3;
}

function themeAccentsEqual(a: ThemeAccents, b: ThemeAccents) {
  return trioEqual(a.light, b.light) && trioEqual(a.dark, b.dark);
}

function modernEqual(a: ModernAccents, b: ModernAccents) {
  if (a.darkAuto !== b.darkAuto) return false;
  if (!trioEqual(a.light, b.light)) return false;
  // While dark is derived it isn't user state, so it can't make the form dirty.
  return a.darkAuto || trioEqual(a.dark, b.dark);
}

function surfacesEqual(a: DarkSurfaces, b: DarkSurfaces) {
  return (
    a.background === b.background &&
    a.card === b.card &&
    a.border === b.border &&
    a.foreground === b.foreground
  );
}

/** Snap a possibly half-typed surface set back to the last saved values. */
function cleanSurfaces(next: DarkSurfaces, fallback: DarkSurfaces): DarkSurfaces {
  const pick = (v: string, def: string) => (isValidHex(v) ? normalizeHex(v) : def);
  return {
    background: pick(next.background, fallback.background),
    card: pick(next.card, fallback.card),
    border: pick(next.border, fallback.border),
    foreground: pick(next.foreground, fallback.foreground),
  };
}

/** Snap a possibly half-typed trio back to the last saved values. */
function cleanTrio(next: AccentTrio, fallback: AccentTrio): AccentTrio {
  return {
    accent: isValidHex(next.accent) ? normalizeHex(next.accent) : fallback.accent,
    accent2: isValidHex(next.accent2) ? normalizeHex(next.accent2) : fallback.accent2,
    accent3: isValidHex(next.accent3) ? normalizeHex(next.accent3) : fallback.accent3,
  };
}

export default function UiSettingsForm({
  initialEnabled,
  initialTheme,
  initialAccents = {
    light: MODERN_ACCENTS_DEFAULT,
    dark: deriveModernDark(MODERN_ACCENTS_DEFAULT),
    darkAuto: true,
  },
  initialBrutalistAccents = { light: BRUTALIST_LIGHT_DEFAULT, dark: BRUTALIST_DARK_DEFAULT },
  initialDarkSurfaces = {
    brutalist: BRUTALIST_DARK_SURFACES_DEFAULT,
    modern: MODERN_DARK_SURFACES_DEFAULT,
  },
}: {
  initialEnabled: boolean;
  initialTheme: UiTheme;
  initialAccents?: ModernAccents;
  initialBrutalistAccents?: ThemeAccents;
  initialDarkSurfaces?: DarkSurfacesByTheme;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [theme, setTheme] = useState<UiTheme>(initialTheme);
  const [saving, setSaving] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Accent state, per theme. The `saved*` copies track what's persisted so the
  // Save button can show a dirty state.
  const [modern, setModern] = useState<ModernAccents>(initialAccents);
  const [savedModern, setSavedModern] = useState<ModernAccents>(initialAccents);
  const [brutalist, setBrutalist] = useState<ThemeAccents>(initialBrutalistAccents);
  const [savedBrutalist, setSavedBrutalist] = useState<ThemeAccents>(initialBrutalistAccents);
  const [accentSaving, setAccentSaving] = useState(false);

  // Dark-mode base surfaces, per theme.
  const [surfaces, setSurfaces] = useState<DarkSurfacesByTheme>(initialDarkSurfaces);
  const [savedSurfaces, setSavedSurfaces] = useState<DarkSurfacesByTheme>(initialDarkSurfaces);
  const [surfaceSaving, setSurfaceSaving] = useState(false);

  // Which colour scheme the editor + preview are showing, and which of the
  // theme's two trios the pickers below are bound to.
  const [scheme, setScheme] = useState<Scheme>("light");

  const isModern = theme === "modern";
  // Modern's dark trio is only editable once auto-derive is switched off.
  const modernDarkLocked = isModern && scheme === "dark" && modern.darkAuto;

  const editing: AccentTrio = isModern ? modern[scheme] : brutalist[scheme];
  const editingDefault = isModern
    ? scheme === "light"
      ? MODERN_ACCENTS_DEFAULT
      : deriveModernDark(modern.light)
    : scheme === "light"
      ? BRUTALIST_LIGHT_DEFAULT
      : BRUTALIST_DARK_DEFAULT;
  const presets = isModern
    ? scheme === "light"
      ? MODERN_PRESETS
      : MODERN_DARK_PRESETS
    : scheme === "light"
      ? BRUTALIST_LIGHT_PRESETS
      : BRUTALIST_DARK_PRESETS;

  const accentsDirty = isModern
    ? !modernEqual(modern, savedModern)
    : !themeAccentsEqual(brutalist, savedBrutalist);

  // Derived tokens for the live preview, in whichever scheme is on screen.
  const preview: TokenSet = isModern
    ? buildModernAccentVars(modern.light, modern.darkAuto ? null : modern.dark)[scheme]
    : buildBrutalistAccentVars(brutalist)[scheme];
  // Preview framing: border weight / radius / shadow always come from the
  // theme, but in dark mode the actual colours come from the admin's chosen
  // surfaces (and their derived muted text) rather than the hardcoded ones.
  const editingSurfaces = surfaces[theme];
  const derivedDark = darkSurfaceVars(editingSurfaces, theme);
  const surface =
    scheme === "dark"
      ? {
          ...SURFACES[theme].dark,
          bg: derivedDark["--background"],
          fg: derivedDark["--foreground"],
          muted: derivedDark["--muted-foreground"],
          border: derivedDark["--border-heavy"],
        }
      : SURFACES[theme].light;
  const surfacesDirty = !surfacesEqual(editingSurfaces, savedSurfaces[theme]);
  const surfaceDefault =
    theme === "modern" ? MODERN_DARK_SURFACES_DEFAULT : BRUTALIST_DARK_SURFACES_DEFAULT;

  function setSurfaceField(key: keyof DarkSurfaces, value: string) {
    setSurfaces((prev) => ({ ...prev, [theme]: { ...prev[theme], [key]: value } }));
  }

  function setSurfaceSet(next: DarkSurfaces) {
    setSurfaces((prev) => ({ ...prev, [theme]: next }));
  }

  async function saveSurfaces() {
    const clean = cleanSurfaces(editingSurfaces, savedSurfaces[theme]);
    setSurfaceSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/ui", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ darkSurfaces: { [theme]: clean } }),
      });
      if (!res.ok) throw new Error("save failed");
      setSurfaces((prev) => ({ ...prev, [theme]: clean }));
      setSavedSurfaces((prev) => ({ ...prev, [theme]: clean }));
      setToast("Dark mode colors updated");
      router.refresh();
    } catch {
      setError("Couldn't save the dark mode colors. Please try again.");
    } finally {
      setSurfaceSaving(false);
    }
  }

  function setEditingTrio(next: AccentTrio) {
    if (!isModern) {
      setBrutalist((prev) => ({ ...prev, [scheme]: next }));
      return;
    }
    setModern((prev) => {
      // Editing light while dark is auto-derived must keep dark in step, so
      // the preview and the dark pickers show what will actually ship.
      if (scheme === "light") {
        return { ...prev, light: next, dark: prev.darkAuto ? deriveModernDark(next) : prev.dark };
      }
      return { ...prev, dark: next };
    });
  }

  // Flipping auto off seeds the custom trio from whatever is currently
  // derived, so the pickers start where the eye already is. Flipping it back
  // on re-derives immediately.
  function setDarkAuto(next: boolean) {
    setModern((prev) => ({
      ...prev,
      darkAuto: next,
      dark: next ? deriveModernDark(prev.light) : prev.dark,
    }));
  }

  function setAccentField(key: keyof AccentTrio, value: string) {
    setEditingTrio({ ...editing, [key]: value });
  }

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

  async function handleThemeChange(next: UiTheme) {
    if (themeSaving || next === theme) return;
    const prev = theme;
    setTheme(next); // optimistic
    setThemeSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/ui", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uiTheme: next }),
      });
      if (!res.ok) throw new Error("save failed");
      setToast(`Site theme switched to ${next === "modern" ? "Modern" : "Neo-Brutalist"}`);
      router.refresh();
    } catch {
      setTheme(prev); // revert on failure
      setError("Couldn't save the theme change. Please try again.");
    } finally {
      setThemeSaving(false);
    }
  }

  async function saveAccents() {
    setAccentSaving(true);
    setError(null);

    // Snap half-typed hexes from the text inputs back to the saved values.
    let body: Record<string, unknown>;
    let nextModern = modern;
    let nextBrutalist = brutalist;
    if (isModern) {
      const light = cleanTrio(modern.light, savedModern.light);
      const dark = modern.darkAuto
        ? deriveModernDark(light)
        : cleanTrio(modern.dark, savedModern.dark);
      nextModern = { light, dark, darkAuto: modern.darkAuto };
      body = {
        modernAccents: {
          light,
          // Only send the override when it's actually in play.
          ...(modern.darkAuto ? {} : { dark }),
          darkAuto: modern.darkAuto,
        },
      };
    } else {
      nextBrutalist = {
        light: cleanTrio(brutalist.light, savedBrutalist.light),
        dark: cleanTrio(brutalist.dark, savedBrutalist.dark),
      };
      body = { brutalistAccents: nextBrutalist };
    }

    try {
      const res = await fetch("/api/settings/ui", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("save failed");
      if (isModern) {
        setModern(nextModern);
        setSavedModern(nextModern);
      } else {
        setBrutalist(nextBrutalist);
        setSavedBrutalist(nextBrutalist);
      }
      setToast("Accent colors updated");
      router.refresh(); // re-render the layout so the new colors apply site-wide
    } catch {
      setError("Couldn't save the accent colors. Please try again.");
    } finally {
      setAccentSaving(false);
    }
  }

  const themeOptions: { value: UiTheme; label: string; desc: string; swatch: AccentTrio }[] = [
    {
      value: "brutalist",
      label: "Neo-Brutalist",
      desc: "Bold borders, hard shadows",
      swatch: brutalist.light,
    },
    {
      value: "modern",
      label: "Modern & Clean",
      desc: "Soft shadows, rounded corners",
      swatch: modern.light,
    },
  ];

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

      {/* Site theme card */}
      <div className="mb-5 rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-900">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
            <Palette className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Site theme
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Switch the entire site&apos;s visual style. Applies to every page immediately.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={themeSaving}
                  onClick={() => handleThemeChange(opt.value)}
                  className={`rounded-xl border p-3 text-left transition ${
                    theme === opt.value
                      ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  } disabled:opacity-60`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {opt.label}
                    </p>
                    {/* Each theme carries its own palette — show it here so the
                        choice reads as "which look", not just "which name". */}
                    <span className="flex -space-x-1">
                      {[opt.swatch.accent, opt.swatch.accent2, opt.swatch.accent3].map((c, i) => (
                        <span
                          key={i}
                          className="h-3.5 w-3.5 rounded-full ring-1 ring-white dark:ring-zinc-900"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{opt.desc}</p>
                </button>
              ))}
            </div>
            {themeSaving && (
              <p className="mt-2 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                saving…
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Accent colors card */}
      <div className="mb-5 rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-900">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-500">
            <Droplet className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Accent colors
              </h2>
              <span className="shrink-0 rounded-full bg-zinc-500/10 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Editing {isModern ? "Modern" : "Neo-Brutalist"}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {isModern
                ? "Set the Modern theme's accent colors. Text contrast, tints and dark-mode variants are generated automatically."
                : "Set the Neo-Brutalist theme's accent colors. Light and dark keep separate palettes — the theme's dark mode is neon-on-charcoal by design, so it isn't derived from light. Text contrast and tints are generated."}
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              These edit the theme selected above. Switch themes to edit the other palette.
            </p>

            {/* Light / dark switch — picks the edited trio for brutalist, and
                the preview scheme for both themes. */}
            <div className="mt-4 inline-flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
              {(
                [
                  { value: "light", label: "Light", Icon: Sun },
                  { value: "dark", label: "Dark", Icon: Moon },
                ] as { value: Scheme; label: string; Icon: typeof Sun }[]
              ).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScheme(value)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    scheme === value
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
            {/* Modern can either derive its dark palette from light or let you
                pick it outright. Brutalist always stores both, so it needs no
                switch here. */}
            {isModern && scheme === "dark" && (
              <div className="mt-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Generate dark colors from light
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {modern.darkAuto
                        ? "Dark mode lightens your light accents automatically. Turn this off to pick them yourself."
                        : "You're picking dark mode's colors directly. Turn this back on to derive them from light again."}
                    </p>
                  </div>
                  <Toggle checked={modern.darkAuto} onChange={() => setDarkAuto(!modern.darkAuto)} />
                </div>
              </div>
            )}

            {/* Presets */}
            <div className={`mt-4 flex flex-wrap gap-2 ${modernDarkLocked ? "pointer-events-none opacity-50" : ""}`}>
              {presets.map((p) => {
                const active = trioEqual(editing, p.trio);
                return (
                  <button
                    key={p.label}
                    type="button"
                    disabled={modernDarkLocked}
                    onClick={() => setEditingTrio(p.trio)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-zinc-400 bg-zinc-100 text-zinc-900 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-100"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <span className="flex -space-x-1">
                      {[p.trio.accent, p.trio.accent2, p.trio.accent3].map((c, i) => (
                        <span
                          key={i}
                          className="h-3.5 w-3.5 rounded-full ring-1 ring-white dark:ring-zinc-900"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </span>
                    {p.label}
                    {active && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>

            {/* Individual pickers */}
            <div className={`mt-4 space-y-3 ${modernDarkLocked ? "opacity-50" : ""}`}>
              {ACCENT_FIELDS.map((f) => {
                const value = editing[f.key];
                const valid = isValidHex(value);
                return (
                  <div key={f.key} className="flex items-center gap-3">
                    <label
                      className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700"
                      style={{ backgroundColor: valid ? value : "transparent" }}
                    >
                      <input
                        type="color"
                        value={valid ? normalizeHex(value) : "#000000"}
                        disabled={modernDarkLocked}
                        onChange={(e) => setAccentField(f.key, e.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                        aria-label={`${f.label} color`}
                      />
                    </label>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {f.label}
                      </p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {f.hint}
                      </p>
                    </div>
                    <input
                      type="text"
                      value={value}
                      disabled={modernDarkLocked}
                      onChange={(e) => setAccentField(f.key, e.target.value)}
                      spellCheck={false}
                      className={`w-28 rounded-lg border bg-transparent px-2.5 py-1.5 font-mono text-xs uppercase text-zinc-900 outline-none dark:text-zinc-100 ${
                        valid
                          ? "border-zinc-200 focus:border-zinc-400 dark:border-zinc-700 dark:focus:border-zinc-500"
                          : "border-red-400 focus:border-red-500"
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Live preview — rendered in the real theme's framing (border
                weight, radius, shadow, surface) so you can see how the colors
                actually land, not just the swatches. */}
            <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-800/50">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Preview
                </span>
                <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                  {isModern ? "Modern" : "Neo-Brutalist"} · {scheme}
                </span>
              </div>

              <div className="p-4" style={{ backgroundColor: surface.bg }}>
                <div
                  className="p-4"
                  style={{
                    backgroundColor: surface.bg,
                    color: surface.fg,
                    border: `${surface.borderWidth}px solid ${surface.border}`,
                    borderRadius: surface.radius,
                    boxShadow: surface.shadow,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="inline-flex items-center px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider"
                      style={{
                        backgroundColor: preview["--accent-3"],
                        color: preview["--on-accent-3"],
                        border: `${surface.borderWidth}px solid ${surface.border}`,
                        borderRadius: surface.pill,
                      }}
                    >
                      Category
                    </span>
                    <span className="text-[11px] font-semibold" style={{ color: surface.muted }}>
                      5 min read
                    </span>
                  </div>

                  <p className="mt-3 text-base font-extrabold tracking-tight">
                    The quick brown fox
                  </p>
                  <p className="mt-1 text-xs" style={{ color: surface.muted }}>
                    Body copy sits on the surface, with links picking up the primary accent.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center px-3 py-2 text-xs font-extrabold uppercase tracking-wide"
                      style={{
                        backgroundColor: preview["--accent"],
                        color: preview["--on-accent"],
                        border: `${surface.borderWidth}px solid ${surface.border}`,
                        borderRadius: surface.pill,
                        boxShadow: surface.shadow,
                      }}
                    >
                      Read more
                    </span>
                    <span
                      className="inline-flex items-center px-3 py-2 text-xs font-extrabold uppercase tracking-wide"
                      style={{
                        backgroundColor: preview["--accent-2"],
                        color: preview["--on-accent-2"],
                        border: `${surface.borderWidth}px solid ${surface.border}`,
                        borderRadius: surface.pill,
                      }}
                    >
                      Featured
                    </span>
                    <span
                      className="inline-flex items-center px-3 py-2 text-xs font-bold"
                      style={{
                        backgroundColor: preview["--accent-tint"],
                        color: preview["--accent"],
                        borderRadius: surface.radius,
                      }}
                    >
                      Tint surface
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={saveAccents}
                disabled={accentSaving || !accentsDirty}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {accentSaving ? "Saving…" : accentsDirty ? "Save colors" : "Saved"}
              </button>
              <button
                type="button"
                onClick={() => setEditingTrio(editingDefault)}
                disabled={accentSaving || trioEqual(editing, editingDefault)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset {isModern ? "" : scheme}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dark mode colors card */}
      <div className="mb-5 rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-900">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-500/10 text-slate-500">
            <Moon className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Dark mode colors
              </h2>
              <span className="shrink-0 rounded-full bg-zinc-500/10 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                Editing {isModern ? "Modern" : "Neo-Brutalist"}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              The base colors dark mode is built from. Muted text, the footer and
              heavier outlines are generated from these, so you only set four.
            </p>

            {/* Presets */}
            <div className="mt-4 flex flex-wrap gap-2">
              {DARK_SURFACE_PRESETS.map((p) => {
                const active = surfacesEqual(editingSurfaces, p.value);
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setSurfaceSet(p.value)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-zinc-400 bg-zinc-100 text-zinc-900 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-100"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full ring-1 ring-zinc-300 dark:ring-zinc-600"
                      style={{ backgroundColor: p.value.background }}
                    />
                    {p.label}
                    {active && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>

            {/* Individual pickers */}
            <div className="mt-4 space-y-3">
              {SURFACE_FIELDS.map((f) => {
                const value = editingSurfaces[f.key];
                const valid = isValidHex(value);
                return (
                  <div key={f.key} className="flex items-center gap-3">
                    <label
                      className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700"
                      style={{ backgroundColor: valid ? value : "transparent" }}
                    >
                      <input
                        type="color"
                        value={valid ? normalizeHex(value) : "#000000"}
                        onChange={(e) => setSurfaceField(f.key, e.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label={`${f.label} color`}
                      />
                    </label>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {f.label}
                      </p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {f.hint}
                      </p>
                    </div>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setSurfaceField(f.key, e.target.value)}
                      spellCheck={false}
                      className={`w-28 rounded-lg border bg-transparent px-2.5 py-1.5 font-mono text-xs uppercase text-zinc-900 outline-none dark:text-zinc-100 ${
                        valid
                          ? "border-zinc-200 focus:border-zinc-400 dark:border-zinc-700 dark:focus:border-zinc-500"
                          : "border-red-400 focus:border-red-500"
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Derived values — shown read-only so it's clear what the four
                pickers above are driving. */}
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2.5 dark:border-zinc-700">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Generated
              </span>
              {(
                [
                  { label: "Muted text", value: derivedDark["--muted-foreground"] },
                  { label: "Outline", value: derivedDark["--border-heavy"] },
                  { label: "Footer", value: derivedDark["--footer-bg"] },
                ] as { label: string; value: string }[]
              ).map((d) => (
                <span key={d.label} className="inline-flex items-center gap-1.5">
                  <span
                    className="h-4 w-4 rounded ring-1 ring-zinc-300 dark:ring-zinc-600"
                    style={{ backgroundColor: d.value }}
                  />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{d.label}</span>
                  <span className="font-mono text-[11px] uppercase text-zinc-400 dark:text-zinc-500">
                    {d.value}
                  </span>
                </span>
              ))}
            </div>

            <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
              Switch the preview above to <strong>Dark</strong> to see these applied.
            </p>

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={saveSurfaces}
                disabled={surfaceSaving || !surfacesDirty}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {surfaceSaving ? "Saving…" : surfacesDirty ? "Save dark colors" : "Saved"}
              </button>
              <button
                type="button"
                onClick={() => setSurfaceSet(surfaceDefault)}
                disabled={surfaceSaving || surfacesEqual(editingSurfaces, surfaceDefault)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animated background card */}
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
