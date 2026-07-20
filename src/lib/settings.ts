import { prisma } from "@/lib/prisma";

// Keys for the SiteSetting key/value store.
export const HOMEPAGE_ANIM_KEY = "homepageAnimatedBackground";
export const SPOTLIGHT_HEADER_KEY = "spotlightAdsHeader";
export const SPOTLIGHT_HEADER_DEFAULT = "Handpicked for you";
export const SPOTLIGHT_TITLE_KEY = "spotlightAdsTitle";
export const SPOTLIGHT_TITLE_DEFAULT = "Deals worth a look";

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

/**
 * Whether the homepage animated (moving-shapes) background is enabled.
 * Defaults to ON when the setting has never been saved.
 */
export async function getHomepageAnimatedBackground(): Promise<boolean> {
  const v = await getSetting(HOMEPAGE_ANIM_KEY);
  return v === null ? true : v === "true";
}

export async function setHomepageAnimatedBackground(on: boolean): Promise<void> {
  await setSetting(HOMEPAGE_ANIM_KEY, on ? "true" : "false");
}

/** Header label shown on the homepage spotlight-ads card. */
export async function getSpotlightAdsHeader(): Promise<string> {
  const v = await getSetting(SPOTLIGHT_HEADER_KEY);
  return v && v.trim() ? v : SPOTLIGHT_HEADER_DEFAULT;
}

export async function setSpotlightAdsHeader(text: string): Promise<void> {
  await setSetting(SPOTLIGHT_HEADER_KEY, text.trim() || SPOTLIGHT_HEADER_DEFAULT);
}

/** Title/headline shown on the homepage spotlight-ads card. */
export async function getSpotlightAdsTitle(): Promise<string> {
  const v = await getSetting(SPOTLIGHT_TITLE_KEY);
  return v === null ? SPOTLIGHT_TITLE_DEFAULT : v;
}

export async function setSpotlightAdsTitle(text: string): Promise<void> {
  await setSetting(SPOTLIGHT_TITLE_KEY, text.trim());
}
