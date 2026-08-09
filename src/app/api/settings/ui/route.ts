import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  getHomepageAnimatedBackground,
  setHomepageAnimatedBackground,
  getSpotlightAdsHeader,
  setSpotlightAdsHeader,
  getSpotlightAdsTitle,
  setSpotlightAdsTitle,
  setUiTheme,
  setModernAccents,
  setBrutalistAccents,
  setDarkSurfaces,
  getThemeSettings,
  type UiTheme,
} from "@/lib/settings";
import { isValidHex, type AccentTrio, type DarkSurfaces } from "@/lib/color";

async function readAll() {
  const [homepageAnimatedBackground, spotlightAdsHeader, spotlightAdsTitle, theme] =
    await Promise.all([
      getHomepageAnimatedBackground(),
      getSpotlightAdsHeader(),
      getSpotlightAdsTitle(),
      getThemeSettings(),
    ]);
  return {
    homepageAnimatedBackground,
    spotlightAdsHeader,
    spotlightAdsTitle,
    uiTheme: theme.uiTheme,
    modernAccents: theme.modernAccents,
    darkSurfaces: theme.darkSurfaces,
    brutalistAccents: theme.brutalistAccents,
  };
}

/** Same partial-patch rule as trioPatch, for the four dark surface fields. */
function surfacePatch(input: unknown): Partial<DarkSurfaces> | null {
  if (!input || typeof input !== "object") return null;
  const src = input as Record<string, unknown>;
  const patch: Partial<DarkSurfaces> = {};
  for (const key of ["background", "card", "border", "foreground"] as const) {
    const v = src[key];
    if (typeof v === "string" && isValidHex(v)) patch[key] = v;
  }
  return Object.keys(patch).length > 0 ? patch : null;
}

/**
 * Pull the valid `#rrggbb` fields out of an untrusted trio payload. Invalid or
 * missing fields are dropped rather than defaulted, so a bad value can never
 * overwrite a colour the admin already saved.
 */
function trioPatch(input: unknown): Partial<AccentTrio> | null {
  if (!input || typeof input !== "object") return null;
  const src = input as Record<string, unknown>;
  const patch: Partial<AccentTrio> = {};
  for (const key of ["accent", "accent2", "accent3"] as const) {
    const v = src[key];
    if (typeof v === "string" && isValidHex(v)) patch[key] = v;
  }
  return Object.keys(patch).length > 0 ? patch : null;
}

// GET /api/settings/ui — current UI settings (public read)
export async function GET() {
  return NextResponse.json(await readAll());
}

// PUT /api/settings/ui — update UI settings (admin only). Partial: only the
// fields present in the body are updated.
export async function PUT(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  let touched = false;

  if (typeof body.homepageAnimatedBackground === "boolean") {
    await setHomepageAnimatedBackground(body.homepageAnimatedBackground);
    touched = true;
  }
  if (typeof body.spotlightAdsHeader === "string") {
    await setSpotlightAdsHeader(body.spotlightAdsHeader);
    touched = true;
  }
  if (typeof body.spotlightAdsTitle === "string") {
    await setSpotlightAdsTitle(body.spotlightAdsTitle);
    touched = true;
  }
  if (body.uiTheme === "brutalist" || body.uiTheme === "modern") {
    await setUiTheme(body.uiTheme as UiTheme);
    touched = true;
  }

  // Modern accents — a light trio, plus an optional hand-picked dark trio.
  // `darkAuto` toggles between deriving dark from light and using that
  // override. Shape mirrors brutalistAccents below.
  const modern = body.modernAccents;
  if (modern && typeof modern === "object") {
    const light = trioPatch(modern.light);
    const dark = trioPatch(modern.dark);
    const darkAuto = typeof modern.darkAuto === "boolean" ? modern.darkAuto : undefined;
    if (light || dark || darkAuto !== undefined) {
      await setModernAccents({
        light: light ?? undefined,
        dark: dark ?? undefined,
        darkAuto,
      });
      touched = true;
    }
  }

  // Brutalist accents — two independent trios, one per colour scheme. Either
  // may be sent on its own.
  const brutalist = body.brutalistAccents;
  if (brutalist && typeof brutalist === "object") {
    const light = trioPatch(brutalist.light);
    const dark = trioPatch(brutalist.dark);
    if (light || dark) {
      await setBrutalistAccents({ light: light ?? undefined, dark: dark ?? undefined });
      touched = true;
    }
  }

  // Dark-mode base surfaces, per theme. Same partial-patch rule as the
  // accents: invalid fields are dropped rather than defaulted.
  const surfaces = body.darkSurfaces;
  if (surfaces && typeof surfaces === "object") {
    const brutalistSurfaces = surfacePatch(surfaces.brutalist);
    const modernSurfaces = surfacePatch(surfaces.modern);
    if (brutalistSurfaces || modernSurfaces) {
      await setDarkSurfaces({
        brutalist: brutalistSurfaces ?? undefined,
        modern: modernSurfaces ?? undefined,
      });
      touched = true;
    }
  }

  if (!touched) {
    return NextResponse.json({ error: "No valid settings provided" }, { status: 400 });
  }

  // Reflect changes across the whole site immediately (theme affects every
  // page via the root layout, not just "/").
  revalidatePath("/", "layout");

  return NextResponse.json(await readAll());
}