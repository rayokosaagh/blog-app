// Product color variants — stored on Product.colors as a JSON array. Each entry
// is a named color with a hex value and an optional photo of the device in that
// color, previewed on hover on the product page.

// A type alias (not an interface) so it carries an implicit index signature and
// stays assignable to Prisma's Json `InputJsonValue` when written to the DB.
export type ProductColor = {
  /** Display label, e.g. "Titanium Blue". */
  name: string;
  /** CSS-usable color, normally a hex like "#3b82f6" (falls back to a swatch box). */
  hex: string;
  /** Optional photo of the device in this color; shown on hover. */
  image: string | null;
};

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** Normalize a raw hex value, defaulting to a neutral gray when unusable. */
export function normalizeHex(value: unknown): string {
  if (typeof value !== "string") return "#cccccc";
  const v = value.trim();
  return HEX_RE.test(v) ? v : "#cccccc";
}

/**
 * Safely coerce an unknown value (a Prisma Json column, or an untrusted request
 * body) into a clean ProductColor[]. Drops entries without a name, trims fields,
 * and normalizes the hex. Never throws.
 */
export function parseColors(value: unknown): ProductColor[] {
  if (!Array.isArray(value)) return [];

  const out: ProductColor[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!name) continue;
    const image =
      typeof r.image === "string" && r.image.trim() !== "" ? r.image.trim() : null;
    out.push({ name, hex: normalizeHex(r.hex), image });
  }
  return out;
}
