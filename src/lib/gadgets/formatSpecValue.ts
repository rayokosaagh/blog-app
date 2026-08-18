import { SpecField, SpecGroup } from "./types";

/**
 * Whether a stored spec value counts as "not filled in".
 *
 * The dashboard writes whatever the form submitted, so a field the editor
 * tabbed through arrives as `" "` or `"\n"` rather than `""`. A bare
 * `raw !== ""` check treats those as real values, which is how the S25 Ultra
 * ended up rendering a "Front Camera System" panel whose only row was a label
 * with nothing beside it — the whitespace passed the emptiness test, then
 * `splitMultiline` correctly produced zero lines to show.
 */
export function isSpecEmpty(raw: unknown): boolean {
  if (raw === null || raw === undefined) return true;
  if (typeof raw === "string") return raw.trim() === "";
  if (Array.isArray(raw)) return raw.every(isSpecEmpty);
  return false;
}

/** A group is worth rendering only when at least one of its fields has a value. */
export function groupHasValues(group: SpecGroup, specs: Record<string, unknown>): boolean {
  return group.fields.some((f) => !isSpecEmpty(specs[f.key]));
}

// Formats a raw spec value (stored as flat JSON on Product.specs) according
// to its field's declared type. Centralized here so the detail page and any
// future comparison view stay in sync on how e.g. booleans/units render.
export function formatSpecValue(field: SpecField, raw: unknown): string {
  if (isSpecEmpty(raw)) return "—";

  switch (field.type) {
    case "boolean":
      return raw === true || raw === "true" ? "Yes" : "No";

    case "number": {
      const num = typeof raw === "number" ? raw : Number(raw);
      if (Number.isNaN(num)) return String(raw);
      const formatted = num.toLocaleString();
      return field.unit ? `${formatted} ${field.unit}` : formatted;
    }

    case "multiline":
      // Stored as newline-separated text — caller decides whether to
      // split into a list; this fallback just preserves line breaks.
      return String(raw);

    default:
      return String(raw);
  }
}

// Splits a multiline spec value into individual lines for list rendering.
export function splitMultiline(raw: unknown): string[] {
  if (raw === null || raw === undefined) return [];
  return String(raw)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}