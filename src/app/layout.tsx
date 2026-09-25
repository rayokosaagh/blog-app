import type { Metadata, Viewport } from "next";
import { cache } from "react";
import { Geist, Geist_Mono, Plus_Jakarta_Sans, Bebas_Neue, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { getThemeSettings } from "@/lib/settings";
import { modernAccentCss, brutalistAccentCss, darkSurfaceCss } from "@/lib/color";
import { bodyFontCss, headingTypeCss } from "@/lib/typography";
import { fontFaceCss, fontRefsIn, googleFontsInUse, googleHref } from "@/lib/fontLibrary";
import { articleTypeCss } from "@/lib/articleType";
import { brutalistBorderCss } from "@/lib/brutalistBorder";
import { accentTextCss } from "@/lib/accentText";
import { APP_URL } from "@/lib/appUrl";
import { BrandingProvider } from "@/components/layout/BrandingContext";

// Read once per request: generateMetadata (for the favicon) and the layout
// both need these, and without the cache each would run its own query.
const loadThemeSettings = cache(getThemeSettings);

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

// Condensed display face for the brutalist section mastheads ("THE LATEST",
// "REVIEWS") and river lead headlines — see .font-condensed in globals.css.
// One weight, latin only, self-hosted by next/font like the others.
const condensed = Bebas_Neue({
  weight: "400",
  variable: "--font-condensed",
  subsets: ["latin"],
});

// Reading face, offered in the article/heading typography settings. Variable
// weight axis, so one file covers 200-900; like every face here it is only
// fetched by a browser when a setting actually uses it.
const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

const SITE_NAME = "Blog";
const SITE_TAGLINE = "Tech news, reviews and gadget comparisons";
const SITE_DESCRIPTION =
  "In-depth phone, laptop, smartwatch and earbud reviews, launch news and " +
  "side-by-side spec comparisons for Nepal.";

const BASE_METADATA: Metadata = {
  // Makes every relative canonical/OG URL below resolve to an absolute one.
  // Without it Next emits relative og:url/og:image, which crawlers and social
  // scrapers ignore.
  metadataBase: new URL(APP_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  // NOTE: the RSS <link rel="alternate"> is emitted by hand in <head> below
  // rather than through `metadata.alternates.types`. Metadata merges shallowly
  // per top-level field, so every page that sets its own `alternates` (for a
  // canonical) would replace the parent object and drop the feed link with it.
  //
  // NOTE: `alternates.canonical` is intentionally NOT set here. Metadata is
  // merged field-by-field from layout down to page, so a canonical declared at
  // the root would be inherited by every page that doesn't override it — and
  // they'd all claim to be "/". Each page sets its own.
};

// The admin-uploaded site icon, or the bundled one. The default favicon lives
// in public/, not app/: file-based metadata overrides `icons`, so an
// app/favicon.ico would win over the uploaded icon on every page.
export async function generateMetadata(): Promise<Metadata> {
  const { branding } = await loadThemeSettings();
  return {
    ...BASE_METADATA,
    icons: {
      icon: branding.siteIcon ?? "/favicon.ico",
      // iOS ignores the manifest's icon list when adding to the home screen;
      // this is the only one it reads.
      apple: branding.siteIcon ?? "/icons/apple-touch-icon.png",
    },
  };
}

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
  const {
    uiTheme,
    modernAccents,
    brutalistAccents,
    darkSurfaces,
    headingType,
    articleType,
    brutalistBorder,
    accentText,
    branding,
    customFonts,
    bodyFont,
  } = await loadThemeSettings();

  // Admin-chosen accent colours for both themes, injected as scoped overrides
  // of the palette tokens. Server-rendered into the initial HTML so there's no
  // colour flash. Each block is keyed to its own [data-theme='…'], so the
  // inactive theme's rules never match — emitting both keeps the switch a
  // pure attribute flip with no second round-trip for colours.
  const accentCss =
    // Admin-uploaded faces. Declared for every library font: a browser only
    // downloads a face when some text actually uses it.
    fontFaceCss(customFonts) +
    brutalistAccentCss(brutalistAccents) +
    // Pass the dark trio only when the admin has taken it over; otherwise it
    // stays derived from the light one.
    modernAccentCss(
      modernAccents.light,
      modernAccents.darkAuto ? null : modernAccents.dark,
    ) +
    // Admin text colours on accent fills. Must follow the accent blocks: the
    // dark rules share a selector and the later one wins.
    accentTextCss(accentText) +
    // Dark-mode base surfaces (background/card/border/text) per theme. Emitted
    // after the accents; they touch a disjoint set of custom properties.
    darkSurfaceCss("brutalist", darkSurfaces.brutalist) +
    darkSurfaceCss("modern", darkSurfaces.modern) +
    // Brutalist outline/shadow overrides. Must follow darkSurfaceCss — both
    // set --border-heavy on the same dark selector and the later one wins.
    brutalistBorderCss(brutalistBorder) +
    // Heading type tokens. Emitted for both themes for the same reason as the
    // palettes above: only the active [data-theme] block matches, so switching
    // theme stays a pure attribute flip.
    headingTypeCss("brutalist", headingType.brutalist, customFonts) +
    headingTypeCss("modern", headingType.modern, customFonts) +
    // Blog post typography — only the values an admin changed; the article
    // CSS falls back to the heading roles above for everything else.
    articleTypeCss("brutalist", articleType.brutalist, customFonts) +
    articleTypeCss("modern", articleType.modern, customFonts) +
    // Site-wide body font per theme (see bodyFontCss in typography.ts).
    bodyFontCss(bodyFont, customFonts);

  // Google Fonts: one request, only for families some setting uses right now.
  const googleFontsHref = googleHref(
    googleFontsInUse(customFonts, fontRefsIn([headingType, articleType, bodyFont])),
  );

  return (
    <html
      lang="en"
      data-theme={uiTheme}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${modernSans.variable} ${condensed.variable} ${serif.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${SITE_NAME} — all articles`}
          href="/rss.xml"
        />
        {googleFontsHref && (
          <>
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link rel="stylesheet" href={googleFontsHref} />
          </>
        )}
        <style id="modern-accents" dangerouslySetInnerHTML={{ __html: accentCss }} />
      </head>
      <body className="min-h-full flex flex-col">
        <BrandingProvider branding={branding}>
          <Providers>
            {children}
          </Providers>
        </BrandingProvider>
      </body>
    </html>
  );
}