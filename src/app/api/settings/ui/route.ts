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
} from "@/lib/settings";

async function readAll() {
  const [homepageAnimatedBackground, spotlightAdsHeader, spotlightAdsTitle] = await Promise.all([
    getHomepageAnimatedBackground(),
    getSpotlightAdsHeader(),
    getSpotlightAdsTitle(),
  ]);
  return { homepageAnimatedBackground, spotlightAdsHeader, spotlightAdsTitle };
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

  if (!touched) {
    return NextResponse.json({ error: "No valid settings provided" }, { status: 400 });
  }

  // Reflect changes on the homepage immediately, bypassing its 60s ISR.
  revalidatePath("/");

  return NextResponse.json(await readAll());
}
