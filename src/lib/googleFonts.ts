import "server-only";
import { FAMILY_RE, googleHref, isFontWeight } from "@/lib/fontLibrary";

type Check = { ok: true } | { ok: false; error: string; status: number };

/** Ask Google whether a family — and then those exact weights — exist. */
export async function checkGoogleFont(input: { family: string; weights: number[]; italic: boolean }): Promise<Check> {
  const family = input.family.trim().replace(/\s+/g, " ");
  if (!FAMILY_RE.test(family)) {
    return { ok: false, error: "Google family names use letters, digits and spaces only", status: 400 };
  }
  if (input.weights.length === 0 || !input.weights.every(isFontWeight)) {
    return { ok: false, error: "Pick weights between 100 and 900", status: 400 };
  }
  const probe = async (href: string) =>
    (await fetch(href, { signal: AbortSignal.timeout(6000), headers: { "User-Agent": "Mozilla/5.0" } })).ok;
  try {
    // Probe the exact weights first: a family-only URL asks for the default
    // 400 instance, which some real families (Buda, Sunflower) don't have.
    const href = googleHref([
      {
        id: "f_probe000",
        name: family,
        fallback: "sans-serif",
        source: "google",
        family,
        weights: [...input.weights].sort((a, b) => a - b),
        italic: input.italic,
      },
    ])!;
    if (await probe(href)) return { ok: true };
    // Only now tell the two failures apart, for the message. A family without
    // a 400 also fails the family-only probe, so that case can't say "missing".
    const familyExists = await probe(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}`);
    return {
      ok: false,
      error: familyExists
        ? `${family} doesn't have all of those weights${input.italic ? " (with italics)" : ""}`
        : `${family} wasn't found on Google Fonts with those weights — check the spelling (names are case-sensitive) and weights`,
      status: 400,
    };
  } catch {
    return { ok: false, error: "Couldn't reach Google Fonts — check the connection and try again", status: 502 };
  }
}
