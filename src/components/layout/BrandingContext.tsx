"use client";

import { createContext, useContext } from "react";
import type { Branding } from "@/lib/settings";

const EMPTY: Branding = { logo: null, logoDark: null, siteIcon: null };

const BrandingContext = createContext<Branding>(EMPTY);

/**
 * Carries the admin's branding images from the root layout (which reads them
 * in the same query as the theme) down to client components like the navbar,
 * which is rendered per page and has no server data of its own.
 */
export function BrandingProvider({
  branding,
  children,
}: {
  branding: Branding;
  children: React.ReactNode;
}) {
  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>;
}

export function useBranding(): Branding {
  return useContext(BrandingContext);
}
