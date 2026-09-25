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
  Square,
  Type,
  Bookmark,
} from "lucide-react";
import { Toggle, SuccessToast } from "@/components/dashboard/DashboardUI";
import HeadingTypeSettings from "@/components/dashboard/HeadingTypeSettings";
import BrutalistBorderSettings from "@/components/dashboard/BrutalistBorderSettings";
import {
  usePreviewEditor,
  PreviewEditPopover,
  PopoverColorField,
  PopoverTextColorField,
  TARGET_CLASS,
} from "@/components/dashboard/PreviewEditor";
import { BRUTALIST_BORDER_DEFAULT, type BrutalistBorder } from "@/lib/brutalistBorder";
import {
  ACCENT_KEYS,
  ACCENT_TEXT_DEFAULT,
  type AccentKey,
  type AccentText,
  type AccentTextSet,
} from "@/lib/accentText";
import type {
  UiTheme,
  ModernAccents,
  DarkSurfacesByTheme,
  HeadingTypeByTheme,
} from "@/lib/settings";
import { BRUTALIST_HEADING_DEFAULT, MODERN_HEADING_DEFAULT } from "@/lib/typography";
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

type SettingsTab = "theme" | "colors" | "borders" | "typography" | "effects";

// What a click in the accent preview can edit. Each preview element maps to
// the accent it's coloured with on the real site (checked against the actual
// components), and whether it carries text on that fill. Dark surfaces are
// separate targets, shown in the dark preview only.
type AccentElement =
  | "readMore"
  | "featured"
  | "category"
  | "tint"
  | "link"
  | "navHover"
  | "toggle"
  | "focusInput"
  | "bookmark";
type AccentTarget = AccentElement | "background" | "card" | "foreground";

const ACCENT_ELEMENTS: Record<
  AccentElement,
  { label: string; accent: AccentKey; withText: boolean; usedFor: string }
> = {
  readMore: { label: "Primary button", accent: "accent", withText: true, usedFor: "Primary buttons, active controls" },
  featured: { label: "Secondary button", accent: "accent2", withText: true, usedFor: "Featured badges, highlights" },
  category: { label: "Category badge", accent: "accent3", withText: true, usedFor: "Category badges on cards and articles" },
  tint: { label: "Tint surface", accent: "accent", withText: false, usedFor: "The tint is generated from the primary accent" },
  link: { label: "Text link", accent: "accent", withText: false, usedFor: "Inline links (“Back to blog”, comment links)" },
  navHover: { label: "Nav item (hover)", accent: "accent2", withText: true, usedFor: "Navbar links on hover, menu buttons" },
  toggle: { label: "Theme toggle", accent: "accent2", withText: true, usedFor: "The light/dark switch in the navbar" },
  focusInput: { label: "Focused input", accent: "accent", withText: false, usedFor: "Sign-in fields and hover rows use the primary tint" },
  bookmark: { label: "Bookmark", accent: "accent", withText: false, usedFor: "The saved-bookmark outline and icon" },
};

const FILL_TOKEN: Record<AccentKey, string> = {
  accent: "--accent",
  accent2: "--accent-2",
  accent3: "--accent-3",
};
const ON_ACCENT_TOKEN: Record<AccentKey, string> = {
  accent: "--on-accent",
  accent2: "--on-accent-2",
  accent3: "--on-accent-3",
};
const ACCENT_NAMES: Record<AccentKey, string> = {
  accent: "Primary",
  accent2: "Secondary",
  accent3: "Tertiary",
};

const SETTINGS_TABS: { value: SettingsTab; label: string; Icon: typeof Sun }[] = [
  { value: "theme", label: "Theme", Icon: Palette },
  { value: "colors", label: "Colors", Icon: Droplet },
  { value: "borders", label: "Borders", Icon: Square },
  { value: "typography", label: "Typography", Icon: Type },
  { value: "effects", label: "Effects", Icon: Sparkles },
];

/**
 * Tab bar for the settings groups. WAI-ARIA tabs pattern: only the active tab
 * is in the tab order, arrow keys / Home / End move between tabs. Tabs holding
 * unsaved edits get a dot, since their Save button may be off screen.
 */
function SettingsTabs({
  active,
  onChange,
  dirty,
}: {
  active: SettingsTab;
  onChange: (tab: SettingsTab) => void;
  dirty: Partial<Record<SettingsTab, boolean>>;
}) {
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const i = SETTINGS_TABS.findIndex((t) => t.value === active);
    const last = SETTINGS_TABS.length - 1;
    const next =
      e.key === "ArrowRight" ? (i === last ? 0 : i + 1)
      : e.key === "ArrowLeft" ? (i === 0 ? last : i - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    const tab = SETTINGS_TABS[next].value;
    onChange(tab);
    document.getElementById(`ui-tab-${tab}`)?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Appearance settings"
      onKeyDown={onKeyDown}
      // Scrolls sideways on narrow screens rather than wrapping to two rows.
      className="-mx-1 flex gap-1 overflow-x-auto border-b border-zinc-200 px-1 dark:border-zinc-800"
    >
      {SETTINGS_TABS.map(({ value, label, Icon }) => {
        const selected = value === active;
        return (
          <button
            key={value}
            id={`ui-tab-${value}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`ui-panel-${value}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(value)}
            className={`relative -mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition ${
              selected
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {dirty[value] && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Unsaved changes" />
                <span className="sr-only">(unsaved changes)</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Every colour here has to survive onColor() in lib/color, which picks white
// text once white clears 3:1 and dark ink below that. That leaves a trap: an
// accent whose white contrast lands between 3.0 and 4.5 gets white text that
// is NOT readable at the 9-12px these fills are used at (category badges, the
// ad-rail eyebrow). Building a ramp as three progressively lighter tints walks
// straight into it — the third step lands in the gap almost every time.
//
// So each trio's third step is deliberately pushed to one side or the other:
// either dark enough to carry white (>= 4.5), or light enough that ink is
// chosen and comfortably readable (white < 3.0). Verified ratios are noted per
// line. If you add a preset, check the third colour before shipping it.
type Preset = { label: string; trio: AccentTrio };

/**
 * Presets, grouped by hue family so a long list stays scannable — an admin
 * looking for "something green" reads one group instead of sixteen pills.
 *
 * `heading` is optional: a single headingless group renders exactly as a plain
 * wrapped row, which is what the brutalist sets (five each) still want.
 */
type PresetGroup = { heading?: string; items: Preset[] };

const MODERN_PRESET_GROUPS: PresetGroup[] = [
  {
    heading: "Blues & purples",
    items: [
      // white 8.98 / 5.17 / 5.70 — all three carry white
      { label: "Purple + blue", trio: { accent: "#5b21b6", accent2: "#2563eb", accent3: "#7c3aed" } },
      // white 10.36 / 5.17, accent3 takes ink at 7.36. accent2 was #3b82f6 (3.68 —
      // in the gap, white text unreadable); #2563eb is the same blue, one step down.
      { label: "Navy + blue", trio: { accent: "#1e3a8a", accent2: "#2563eb", accent3: "#60a5fa" } },
      // white 9.93 / 6.29, accent3 takes ink at 9.38
      { label: "Indigo", trio: { accent: "#3730a3", accent2: "#4f46e5", accent3: "#a5b4fc" } },
      // white 10.95 / 7.10, accent3 takes ink at 10.13
      { label: "Aubergine", trio: { accent: "#4c1d95", accent2: "#6d28d9", accent3: "#c4b5fd" } },
      // white 10.88 / 6.32, accent3 takes ink at 10.63
      { label: "Plum", trio: { accent: "#581c87", accent2: "#a21caf", accent3: "#f0abfc" } },
    ],
  },
  {
    heading: "Greens & teals",
    items: [
      // white 9.48 / 5.47, accent3 takes ink at 12.65
      { label: "Teal", trio: { accent: "#134e4a", accent2: "#0f766e", accent3: "#5eead4" } },
      // white 9.46 / 5.93, accent3 takes ink at 12.91
      { label: "Midnight & cyan", trio: { accent: "#0c4a6e", accent2: "#0369a1", accent3: "#67e8f9" } },
      // white 9.11 / 5.36, accent3 takes ink at 14.99
      { label: "Ocean", trio: { accent: "#164e63", accent2: "#0e7490", accent3: "#a5f3fc" } },
      // white 9.72 / 5.48, accent3 takes ink at 12.27
      { label: "Emerald", trio: { accent: "#064e3b", accent2: "#047857", accent3: "#6ee7b7" } },
      // white 9.11 / 5.02, accent3 takes ink at 15.44
      { label: "Forest", trio: { accent: "#14532d", accent2: "#15803d", accent3: "#bbf7d0" } },
    ],
  },
  {
    heading: "Warm",
    items: [
      // white 14.68 / 5.02, accent3 takes ink at 11.21
      { label: "Graphite & amber", trio: { accent: "#1f2937", accent2: "#b45309", accent3: "#fbbf24" } },
      // white 9.37 / 5.18, accent3 takes ink at 13.82
      { label: "Copper", trio: { accent: "#7c2d12", accent2: "#c2410c", accent3: "#fed7aa" } },
      // white 9.57 / 6.29, accent3 takes ink at 9.89
      { label: "Rose", trio: { accent: "#881337", accent2: "#be123c", accent3: "#fda4af" } },
      // white 7.88 / 6.04, accent3 takes ink at 13.53. accent2 was #db2777, which
      // clears the bar by only 0.10 (4.60); #be185d is the same pink one step down.
      { label: "Sunset", trio: { accent: "#9d174d", accent2: "#be185d", accent3: "#fbcfe8" } },
    ],
  },
  {
    heading: "Neutral",
    items: [
      // white 17.85 / 10.35, accent3 takes ink at 7.30
      { label: "Slate", trio: { accent: "#0f172a", accent2: "#334155", accent3: "#94a3b8" } },
      // white 14.63 / 7.58, accent3 takes ink at 12.60
      { label: "Steel", trio: { accent: "#1e293b", accent2: "#475569", accent3: "#cbd5e1" } },
    ],
  },
];

// Modern dark presets — lighter, desaturated tints that hold up against the
// near-black modern surface, since the deep light-mode violets go muddy there.
// Every step here is pale enough that onColor picks ink rather than white, so
// all three land well past 4.5 against the near-black surface. Measured ink
// ratios noted per line.
const MODERN_DARK_PRESET_GROUPS: PresetGroup[] = [
  {
    heading: "Violets & blues",
    items: [
      { label: "Soft violet", trio: deriveModernDark(MODERN_ACCENTS_DEFAULT) },
      // ink 10.13 / 13.47 / 15.76
      { label: "Lilac", trio: { accent: "#c4b5fd", accent2: "#ddd6fe", accent3: "#ede9fe" } },
      // ink 9.38 / 12.54 / 10.58
      { label: "Iris", trio: { accent: "#a5b4fc", accent2: "#c7d2fe", accent3: "#d8b4fe" } },
      // ink 11.22 / 14.99 / 14.10
      { label: "Sky", trio: { accent: "#7dd3fc", accent2: "#a5f3fc", accent3: "#bae6fd" } },
    ],
  },
  {
    heading: "Greens & aquas",
    items: [
      // ink 12.27 / 14.59 / 12.65
      { label: "Mint", trio: { accent: "#6ee7b7", accent2: "#a7f3d0", accent3: "#5eead4" } },
      // ink 12.91 / 14.99 / 14.84
      { label: "Aqua", trio: { accent: "#67e8f9", accent2: "#a5f3fc", accent3: "#99f6e4" } },
      // ink 15.44 / 16.02 / 14.59
      { label: "Sage", trio: { accent: "#bbf7d0", accent2: "#d9f99d", accent3: "#a7f3d0" } },
    ],
  },
  {
    heading: "Warm",
    items: [
      // ink 11.09 / 12.97 / 9.89
      { label: "Peach", trio: { accent: "#fdba74", accent2: "#fcd34d", accent3: "#fda4af" } },
      // ink 9.89 / 13.26 / 13.53
      { label: "Rose quartz", trio: { accent: "#fda4af", accent2: "#fecdd3", accent3: "#fbcfe8" } },
      // ink 12.97 / 15.02 / 11.09
      { label: "Amber", trio: { accent: "#fcd34d", accent2: "#fde68a", accent3: "#fdba74" } },
    ],
  },
];

// Brutalist presets are per-scheme: light leans primary-bright, dark leans
// neon, matching how the theme's two palettes are designed. Five each, so they
// stay a single unlabelled group rather than being split into hue families.
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
  { key: "accent", label: "Primary", hint: "Buttons, links, active tabs" },
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
  initialHeadingType = {
    brutalist: BRUTALIST_HEADING_DEFAULT,
    modern: MODERN_HEADING_DEFAULT,
  },
  initialBrutalistBorder = BRUTALIST_BORDER_DEFAULT,
  initialAccentText = ACCENT_TEXT_DEFAULT,
}: {
  initialEnabled: boolean;
  initialTheme: UiTheme;
  initialAccents?: ModernAccents;
  initialBrutalistAccents?: ThemeAccents;
  initialDarkSurfaces?: DarkSurfacesByTheme;
  initialHeadingType?: HeadingTypeByTheme;
  initialBrutalistBorder?: BrutalistBorder;
  initialAccentText?: AccentText;
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

  // Heading typography, per theme. Same saved/editing split as the accents so
  // the panel can show a dirty state.
  const [headingType, setHeadingType] = useState<HeadingTypeByTheme>(initialHeadingType);
  const [savedHeadingType, setSavedHeadingType] =
    useState<HeadingTypeByTheme>(initialHeadingType);

  // Brutalist outline/shadow. Same saved/editing split for the dirty state.
  const [border, setBorder] = useState<BrutalistBorder>(initialBrutalistBorder);
  const [savedBorder, setSavedBorder] = useState<BrutalistBorder>(initialBrutalistBorder);

  // Text colours on accent fills (null = auto contrast). Saved with the
  // accents, so they share the Colors panel's dirty state and Save button.
  const [accentText, setAccentText] = useState<AccentText>(initialAccentText);
  const [savedAccentText, setSavedAccentText] = useState<AccentText>(initialAccentText);

  // Which settings group is on screen. All edit state lives above, so switching
  // tabs never drops unsaved changes — the tab bar flags them instead.
  const [tab, setTab] = useState<SettingsTab>("theme");

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
  // Brutalist's five-item lists are wrapped as one headingless group so the
  // renderer below has a single shape to deal with.
  const presetGroups: PresetGroup[] = isModern
    ? scheme === "light"
      ? MODERN_PRESET_GROUPS
      : MODERN_DARK_PRESET_GROUPS
    : scheme === "light"
      ? [{ items: BRUTALIST_LIGHT_PRESETS }]
      : [{ items: BRUTALIST_DARK_PRESETS }];

  const accentTextDirty =
    JSON.stringify(accentText[theme]) !== JSON.stringify(savedAccentText[theme]);
  const accentsDirty =
    accentTextDirty ||
    (isModern ? !modernEqual(modern, savedModern) : !themeAccentsEqual(brutalist, savedBrutalist));

  // Derived tokens for the live preview, in whichever scheme is on screen,
  // with any text-on-accent overrides laid over the auto contrast colours.
  const derivedPreview: TokenSet = isModern
    ? buildModernAccentVars(modern.light, modern.darkAuto ? null : modern.dark)[scheme]
    : buildBrutalistAccentVars(brutalist)[scheme];
  const textOverrides = accentText[theme][scheme];
  const preview: TokenSet = { ...derivedPreview };
  for (const k of ACCENT_KEYS) {
    const v = textOverrides[k];
    if (v && isValidHex(v)) preview[ON_ACCENT_TOKEN[k]] = normalizeHex(v);
  }

  function setAccentTextField(key: AccentKey, value: string | null) {
    setAccentText((prev) => ({
      ...prev,
      [theme]: { ...prev[theme], [scheme]: { ...prev[theme][scheme], [key]: value } },
    }));
  }
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
          card: derivedDark["--card"],
          fg: derivedDark["--foreground"],
          muted: derivedDark["--muted-foreground"],
          border: derivedDark["--border-heavy"],
        }
      : { ...SURFACES[theme].light, card: SURFACES[theme].light.bg };

  // Click-to-edit in the accent preview. Accent targets edit the trio on
  // screen; surface targets (dark only) edit the dark-mode surfaces, which
  // save with their own panel below.
  const {
    containerRef: accentPreviewRef,
    editing: accentEditing,
    close: closeAccentEditor,
    target: accentTarget,
  } = usePreviewEditor<AccentTarget>();

  /**
   * The accent an element is painted with *in the scheme on screen*. Only the
   * bookmark varies: light follows the primary; brutalist dark re-points it at
   * the tertiary (buildBrutalistAccentVars), and modern dark hardcodes it in
   * globals.css — no setting drives it there, so it isn't a target.
   */
  function elementAccent(el: AccentElement): AccentKey | null {
    if (el === "bookmark" && scheme === "dark") return isModern ? null : "accent3";
    return ACCENT_ELEMENTS[el].accent;
  }

  function accentEditorBody(key: AccentTarget) {
    if (key === "background" || key === "card" || key === "foreground") {
      const f = SURFACE_FIELDS.find((s) => s.key === key)!;
      return {
        title: `Dark ${f.label.toLowerCase()}`,
        hint: `${f.hint}. Saved with Dark mode colors below.`,
        body: (
          <PopoverColorField
            value={editingSurfaces[key]}
            onChange={(v) => setSurfaceField(key, v)}
          />
        ),
      };
    }
    const el = ACCENT_ELEMENTS[key];
    const accent = elementAccent(key) ?? el.accent;
    const fill = isValidHex(editing[accent]) ? normalizeHex(editing[accent]) : derivedPreview[FILL_TOKEN[accent]];
    return {
      title: `${el.label} · ${scheme}`,
      hint: modernDarkLocked
        ? "Generated from the light palette. Turn off “Generate dark colors from light” to pick it."
        : `${ACCENT_NAMES[accent]} accent — applies everywhere it's used. ${el.usedFor}.`,
      body: (
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {el.withText ? "Fill" : "Color"} · {ACCENT_NAMES[accent]}
            </p>
            <PopoverColorField
              value={editing[accent]}
              disabled={modernDarkLocked}
              onChange={(v) => setAccentField(accent, v)}
            />
          </div>
          {el.withText && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Text on {ACCENT_NAMES[accent].toLowerCase()}
              </p>
              <PopoverTextColorField
                value={textOverrides[accent]}
                auto={derivedPreview[ON_ACCENT_TOKEN[accent]]}
                fill={fill}
                onChange={(v) => setAccentTextField(accent, v)}
              />
            </div>
          )}
        </div>
      ),
    };
  }
  const surfacesDirty = !surfacesEqual(editingSurfaces, savedSurfaces[theme]);
  const colorsDirty = accentsDirty || surfacesDirty;
  const bordersDirty = !isModern && JSON.stringify(border) !== JSON.stringify(savedBorder);
  const headingsDirty =
    JSON.stringify(headingType[theme]) !== JSON.stringify(savedHeadingType[theme]);
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

    // Text overrides: a half-typed hex snaps back to what's saved rather than
    // reaching the server, which would read it as "auto".
    const cleanText = (set: AccentTextSet, saved: AccentTextSet): AccentTextSet => ({
      accent: set.accent === null || isValidHex(set.accent) ? set.accent : saved.accent,
      accent2: set.accent2 === null || isValidHex(set.accent2) ? set.accent2 : saved.accent2,
      accent3: set.accent3 === null || isValidHex(set.accent3) ? set.accent3 : saved.accent3,
    });
    const nextAccentText: AccentText = {
      ...accentText,
      [theme]: {
        light: cleanText(accentText[theme].light, savedAccentText[theme].light),
        dark: cleanText(accentText[theme].dark, savedAccentText[theme].dark),
      },
    };
    if (accentTextDirty) body.accentText = nextAccentText;

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
      setAccentText(nextAccentText);
      setSavedAccentText(nextAccentText);
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
    <div className="max-w-5xl">
      <div className="mb-6">
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

      <SettingsTabs
        active={tab}
        onChange={(next) => {
          setTab(next);
          closeAccentEditor();
        }}
        dirty={{ colors: colorsDirty, borders: bordersDirty, typography: headingsDirty }}
      />

      <div
        role="tabpanel"
        id={`ui-panel-${tab}`}
        aria-labelledby={`ui-tab-${tab}`}
        className="mt-6"
      >
        {tab === "theme" && (
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
        )}

        {tab === "colors" && (
          <>
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
                    These edit the theme chosen on the Theme tab. Switch themes there to edit the other palette.
                  </p>

                  {/* Controls left, preview right on wide screens; stacked below lg. */}
                  <div className="mt-5 grid gap-6 lg:grid-cols-2">
                    <div className="min-w-0">
                      {/* Light / dark switch — picks the edited trio for brutalist, and
                          the preview scheme for both themes. */}
                      <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
                        {(
                          [
                            { value: "light", label: "Light", Icon: Sun },
                            { value: "dark", label: "Dark", Icon: Moon },
                          ] as { value: Scheme; label: string; Icon: typeof Sun }[]
                        ).map(({ value, label, Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setScheme(value);
                              closeAccentEditor();
                            }}
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

                      <div className={`mt-4 space-y-3 ${modernDarkLocked ? "pointer-events-none opacity-50" : ""}`}>
                        {presetGroups.map((group, gi) => (
                          <div key={group.heading ?? `group-${gi}`}>
                            {group.heading && (
                              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                                {group.heading}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {group.items.map((p) => {
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
                          </div>
                        ))}
                      </div>

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

                    </div>

                    {/* Live preview — rendered in the real theme's framing (border
                        weight, radius, shadow, surface) so you can see how the colors
                        actually land, not just the swatches. Sticks while the preset
                        list scrolls past on wide screens. */}
                    <div
                      ref={accentPreviewRef}
                      className="relative min-w-0 lg:sticky lg:top-6 lg:self-start"
                    >
                      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-800/50">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            Preview · click to edit
                          </span>
                          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                            {isModern ? "Modern" : "Neo-Brutalist"} · {scheme}
                          </span>
                        </div>

                        {/* Surface targets exist only in the dark preview —
                            light mode's surfaces aren't configurable. */}
                        <div
                          className={`p-4 ${scheme === "dark" ? TARGET_CLASS : ""}`}
                          style={{ backgroundColor: surface.bg }}
                          {...(scheme === "dark" ? accentTarget("background", "dark background") : {})}
                        >
                          <div
                            className={`p-4 ${scheme === "dark" ? TARGET_CLASS : ""}`}
                            style={{
                              backgroundColor: surface.card,
                              color: surface.fg,
                              border: `${surface.borderWidth}px solid ${surface.border}`,
                              borderRadius: surface.radius,
                              boxShadow: surface.shadow,
                            }}
                            {...(scheme === "dark" ? accentTarget("card", "dark card surface") : {})}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span
                                {...accentTarget("category", "category badge")}
                                className={`inline-flex items-center px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${TARGET_CLASS}`}
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

                            <p
                              className={`mt-3 text-base font-extrabold tracking-tight ${scheme === "dark" ? `inline-block ${TARGET_CLASS}` : ""}`}
                              {...(scheme === "dark" ? accentTarget("foreground", "dark text") : {})}
                            >
                              The quick brown fox
                            </p>
                            <p className="mt-1 text-xs" style={{ color: surface.muted }}>
                              Body copy sits on the surface, with links picking up the primary accent.
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <span
                                {...accentTarget("readMore", "primary button")}
                                className={`inline-flex items-center px-3 py-2 text-xs font-extrabold uppercase tracking-wide ${TARGET_CLASS}`}
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
                                {...accentTarget("featured", "secondary button")}
                                className={`inline-flex items-center px-3 py-2 text-xs font-extrabold uppercase tracking-wide ${TARGET_CLASS}`}
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
                                // The tint is generated from the primary accent.
                                {...accentTarget("tint", "tint surface")}
                                className={`inline-flex items-center px-3 py-2 text-xs font-bold ${TARGET_CLASS}`}
                                style={{
                                  backgroundColor: preview["--accent-tint"],
                                  color: preview["--accent"],
                                  borderRadius: surface.radius,
                                }}
                              >
                                Tint surface
                              </span>
                            </div>
                            {/* More accent-coloured parts, painted the way the
                                real components are (see ACCENT_ELEMENTS). */}
                            <div
                              className="mt-4 flex flex-wrap items-center gap-3 pt-4"
                              style={{ borderTop: `1px dashed ${surface.muted}` }}
                            >
                              <span
                                {...accentTarget("link", "text link")}
                                className={`text-xs font-bold underline-offset-2 hover:underline ${TARGET_CLASS}`}
                                style={{ color: preview["--accent"] }}
                              >
                                Back to blog →
                              </span>
                              <span
                                {...accentTarget("navHover", "nav item on hover")}
                                className={`inline-flex items-center px-3 py-2 text-xs font-extrabold uppercase tracking-wide ${TARGET_CLASS}`}
                                style={{
                                  backgroundColor: preview["--accent-2"],
                                  color: preview["--on-accent-2"],
                                  border: `${Math.min(surface.borderWidth, 2)}px solid ${surface.border}`,
                                  borderRadius: surface.pill,
                                }}
                              >
                                News
                              </span>
                              {/* The navbar toggle only wears the secondary in
                                  light mode; its dark track is the text colour. */}
                              {scheme === "light" && (
                                <span
                                  {...accentTarget("toggle", "theme toggle")}
                                  className={`relative inline-flex h-5 w-10 items-center p-0.5 ${TARGET_CLASS}`}
                                  style={{
                                    backgroundColor: preview["--accent-2"],
                                    border: `1.5px solid ${surface.border}`,
                                    borderRadius: surface.pill || 0,
                                  }}
                                >
                                  <span
                                    className="flex h-4 w-4 items-center justify-center"
                                    style={{
                                      backgroundColor: surface.bg,
                                      border: `1.5px solid ${surface.border}`,
                                      borderRadius: surface.pill || 0,
                                    }}
                                  >
                                    <Sun className="h-2.5 w-2.5" style={{ color: preview["--on-accent-2"] }} />
                                  </span>
                                </span>
                              )}
                              <span
                                {...accentTarget("focusInput", "focused input")}
                                className={`inline-flex items-center px-3 py-2 text-xs ${TARGET_CLASS}`}
                                style={{
                                  backgroundColor: preview["--accent-tint"],
                                  color: surface.fg,
                                  border: `${Math.min(surface.borderWidth, 2)}px solid ${surface.border}`,
                                  borderRadius: surface.radius,
                                }}
                              >
                                you@example.com
                              </span>
                              {(() => {
                                const bm = elementAccent("bookmark");
                                // Modern dark hardcodes the bookmark colour in
                                // globals.css, so it's shown but not editable.
                                const color = bm ? preview[FILL_TOKEN[bm]] : "#ff2ec4";
                                return (
                                  <span
                                    {...(bm ? accentTarget("bookmark", "bookmark") : { title: "Fixed in Modern dark mode" })}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold ${bm ? TARGET_CLASS : ""}`}
                                    style={{ color, border: `2px solid ${color}`, borderRadius: surface.radius }}
                                  >
                                    <Bookmark className="h-3.5 w-3.5" />
                                    Saved
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {accentEditing && (() => {
                        const { title, hint, body } = accentEditorBody(accentEditing.key);
                        return (
                          <PreviewEditPopover
                            anchor={accentEditing.anchor}
                            title={title}
                            hint={hint}
                            onClose={closeAccentEditor}
                          >
                            {body}
                          </PreviewEditPopover>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
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
                      onClick={() => {
                        setEditingTrio(editingDefault);
                        // Text colours go back to auto along with the fills.
                        setAccentText((prev) => ({
                          ...prev,
                          [theme]: { ...prev[theme], [scheme]: ACCENT_TEXT_DEFAULT[theme][scheme] },
                        }));
                      }}
                      disabled={
                        accentSaving ||
                        (trioEqual(editing, editingDefault) &&
                          ACCENT_KEYS.every((k) => textOverrides[k] === null))
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset {isModern ? "" : scheme}
                    </button>
                  </div>
                </div>
              </div>
            </div>

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

                  <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    {SURFACE_FIELDS.map((f) => {
                      const value = editingSurfaces[f.key];
                      const valid = isValidHex(value);
                      return (
                        // min-w-0: grid items default to their content width,
                        // which let the long hints push the hex field out.
                        <div key={f.key} className="flex min-w-0 items-center gap-3">
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
                    Switch the accent preview above to <strong>Dark</strong> to see these applied.
                  </p>

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
          </>
        )}

        {tab === "effects" && (
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
        )}

        {tab === "borders" && isModern && (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
              Borders &amp; shadows only apply to the{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Neo-Brutalist</span>{" "}
              theme — Modern uses hairline borders and soft shadows. Switch themes on the{" "}
              <button
                type="button"
                onClick={() => setTab("theme")}
                className="font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
              >
                Theme
              </button>{" "}
              tab to edit them.
            </div>
        )}

        {tab === "borders" && !isModern && (
            <BrutalistBorderSettings
              value={border}
              saved={savedBorder}
              // From the *saved* surfaces: that's what the site's dark outline
              // currently derives from, until the surfaces above are saved too.
              darkBorderDefault={darkSurfaceVars(savedSurfaces.brutalist, "brutalist")["--border-heavy"]}
              darkBackground={savedSurfaces.brutalist.background}
              onChange={setBorder}
              onSaved={(next) => {
                setSavedBorder(next);
                setToast("Borders & shadows updated");
              }}
              onError={setError}
            />
        )}

        {tab === "typography" && (
          <HeadingTypeSettings
            theme={theme}
            value={headingType[theme]}
            saved={savedHeadingType[theme]}
            onChange={(next) => setHeadingType((prev) => ({ ...prev, [theme]: next }))}
            onSaved={(next) => {
              setSavedHeadingType((prev) => ({ ...prev, [theme]: next }));
              setToast("Heading styles updated");
            }}
            onError={setError}
          />
        )}
      </div>

      {toast && <SuccessToast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
