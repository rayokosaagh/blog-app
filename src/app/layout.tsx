import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { getThemeSettings } from "@/lib/settings";
import { modernAccentCss, brutalistAccentCss, darkSurfaceCss } from "@/lib/color";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Typeface for the "modern" site theme — a clean, contemporary geometric
// sans. Loaded via next/font (self-hosted, no render-blocking request) and
// exposed as --font-modern, which globals.css maps to --font-sans under
// [data-theme='modern']. Brutalist keeps Space Grotesk.
const modernSans = Plus_Jakarta_Sans({
  variable: "--font-modern",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blog",
  description: "",
};

// Tells the mobile browser chrome (address bar / status bar) what color to
// use, per color scheme, instead of falling back to a mismatched default —
// this is what was causing the stray magenta line above the navbar.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1322" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { uiTheme, modernAccents, brutalistAccents, darkSurfaces } = await getThemeSettings();

  // Admin-chosen accent colours for both themes, injected as scoped overrides
  // of the palette tokens. Server-rendered into the initial HTML so there's no
  // colour flash. Each block is keyed to its own [data-theme='…'], so the
  // inactive theme's rules never match — emitting both keeps the switch a
  // pure attribute flip with no second round-trip for colours.
  const accentCss =
    brutalistAccentCss(brutalistAccents) +
    // Pass the dark trio only when the admin has taken it over; otherwise it
    // stays derived from the light one.
    modernAccentCss(
      modernAccents.light,
      modernAccents.darkAuto ? null : modernAccents.dark,
    ) +
    // Dark-mode base surfaces (background/card/border/text) per theme. Emitted
    // after the accents; they touch a disjoint set of custom properties.
    darkSurfaceCss("brutalist", darkSurfaces.brutalist) +
    darkSurfaceCss("modern", darkSurfaces.modern);

  return (
    <html
      lang="en"
      data-theme={uiTheme}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${modernSans.variable} h-full antialiased`}
    >
      <head>
        <style id="modern-accents" dangerouslySetInnerHTML={{ __html: accentCss }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}