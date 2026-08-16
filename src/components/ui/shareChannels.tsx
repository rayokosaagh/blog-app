/**
 * One definition of the share channels, used by both ShareMenu (the popover on
 * product pages) and ShareButtons (the inline row on posts). They drifted apart
 * before — the row was missing Instagram and shipped a WhatsApp fill that gave
 * its white glyph 1.98:1.
 *
 * Brand fills carry a white glyph, so each must clear 3:1 (icons are non-text
 * UI under WCAG). Two official palettes needed their darker variant:
 *   WhatsApp #25D366 -> white 1.98:1  (rejected)  ->  #128C7E  4.14:1
 *   Telegram #229ED9 -> white 3.02:1  (too tight) ->  #1D8BC0  3.81:1
 * Hover classes are written as literals so Tailwind's scanner sees them; never
 * build these strings dynamically.
 */

// lucide-react dropped brand logos over licensing, so these are the standard
// minimal glyphs rather than hand-drawn art.
export function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.891h-2.33v6.987C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M12.04 2c-5.523 0-10 4.477-10 10 0 1.763.46 3.485 1.334 5.001L2 22l5.116-1.343A9.96 9.96 0 0012.04 22c5.523 0 10-4.477 10-10s-4.477-10-10-10zm5.842 14.29c-.243.686-1.415 1.312-1.948 1.354-.517.043-1.03.226-3.454-.79-2.943-1.234-4.828-4.264-4.975-4.462-.146-.198-1.192-1.634-1.192-3.117 0-1.482.762-2.207 1.03-2.51.269-.303.586-.365.782-.365s.39.002.56.01c.18.008.42-.068.657.514.243.596.828 2.058.9 2.208.073.15.122.325.024.523-.098.198-.146.32-.293.49-.146.17-.309.38-.44.51-.147.147-.3.306-.13.6.171.293.762 1.28 1.635 2.073 1.123 1.018 2.07 1.333 2.363 1.483.293.15.464.126.634-.077.171-.202.732-.858.928-1.152.196-.293.391-.244.66-.146.269.098 1.708.822 2.001.972.293.15.489.226.562.35.073.126.073.723-.17 1.41z" />
    </svg>
  );
}

export function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.053 1.805.249 2.227.415.56.217.96.477 1.38.896.42.42.68.82.896 1.38.166.422.362 1.057.415 2.227.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.053 1.17-.249 1.805-.415 2.227-.217.56-.477.96-.896 1.38-.42.42-.82.68-1.38.896-.422.166-1.057.362-2.227.415-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.053-1.805-.249-2.227-.415-.56-.217-.96-.477-1.38-.896-.42-.42-.68-.82-.896-1.38-.166-.422-.362-1.057-.415-2.227-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.053-1.17.249-1.805.415-2.227.217-.56.477-.96.896-1.38.42-.42.82-.68 1.38-.896.422-.166 1.057-.362 2.227-.415 1.266-.058 1.646-.07 4.85-.07zm0 2.16c-3.15 0-3.522.012-4.766.069-1.15.052-1.774.244-2.19.406-.55.214-.943.469-1.356.881-.412.413-.667.806-.881 1.356-.162.416-.354 1.04-.406 2.19-.057 1.244-.069 1.616-.069 4.766s.012 3.522.069 4.766c.052 1.15.244 1.774.406 2.19.214.55.469.943.881 1.356.413.412.806.667 1.356.881.416.162 1.04.354 2.19.406 1.244.057 1.616.069 4.766.069s3.522-.012 4.766-.069c1.15-.052 1.774-.244 2.19-.406.55-.214.943-.469 1.356-.881.412-.413.667-.806.881-1.356.162-.416.354-1.04.406-2.19.057-1.244.069-1.616.069-4.766s-.012-3.522-.069-4.766c-.052-1.15-.244-1.774-.406-2.19-.214-.55-.469-.943-.881-1.356-.413-.412-.806-.667-1.356-.881-.416-.162-1.04-.354-2.19-.406-1.244-.057-1.616-.069-4.766-.069zm0 3.678a6.159 6.159 0 110 12.318 6.159 6.159 0 010-12.318zm0 2.16a3.999 3.999 0 100 7.998 3.999 3.999 0 000-7.998zm6.406-3.845a1.44 1.44 0 110 2.88 1.44 1.44 0 010-2.88z" />
    </svg>
  );
}

export function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export type ShareChannel = {
  name: string;
  Icon: () => React.JSX.Element;
  /** On a card/page surface. Carries its own `dark:` pair — see the note below. */
  hoverSurface: string;
  /** On the post hero's photo plate, which is always dark. */
  hoverPhoto: string;
  buildUrl: (url: string, title: string) => string;
};

/**
 * Matching BookmarkButton means the brand colour lands on the *border and
 * text*, not on a fill — so each brand needs a light-surface and a dark-surface
 * value. Reusing one set breaks: on a dark card, X's #000000 gives 1.44:1 and
 * Instagram's #C13584 gives 2.86:1, both under the 3:1 icon bar.
 *
 * Measured, on white / on #1e293b:
 *   X          #000000 21.00  ->  #ffffff 14.63
 *   Facebook   #1877F2  4.23  ->  #60a5fa  5.75
 *   WhatsApp   #128C7E  4.14  ->  #34d399  7.61
 *   Instagram  #C13584  5.11  ->  #f472b6  5.52
 *   Telegram   #1D8BC0  3.81  ->  #38bdf8  6.83
 * The photo plate is always dark, so it reuses the dark values.
 */
export const SHARE_CHANNELS: ShareChannel[] = [
  {
    name: "X",
    Icon: XIcon,
    hoverSurface:
      "hover:border-[#000000] hover:text-[#000000] dark:hover:border-[#ffffff] dark:hover:text-[#ffffff]",
    hoverPhoto: "hover:border-[#ffffff] hover:text-[#ffffff]",
    buildUrl: (url, title) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: "Facebook",
    Icon: FacebookIcon,
    hoverSurface:
      "hover:border-[#1877F2] hover:text-[#1877F2] dark:hover:border-[#60a5fa] dark:hover:text-[#60a5fa]",
    hoverPhoto: "hover:border-[#60a5fa] hover:text-[#60a5fa]",
    buildUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "WhatsApp",
    Icon: WhatsAppIcon,
    hoverSurface:
      "hover:border-[#128C7E] hover:text-[#128C7E] dark:hover:border-[#34d399] dark:hover:text-[#34d399]",
    hoverPhoto: "hover:border-[#34d399] hover:text-[#34d399]",
    buildUrl: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    name: "Telegram",
    Icon: TelegramIcon,
    hoverSurface:
      "hover:border-[#1D8BC0] hover:text-[#1D8BC0] dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]",
    hoverPhoto: "hover:border-[#38bdf8] hover:text-[#38bdf8]",
    buildUrl: (url, title) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
];

export const INSTAGRAM_HOVER_SURFACE =
  "hover:border-[#C13584] hover:text-[#C13584] dark:hover:border-[#f472b6] dark:hover:text-[#f472b6]";
export const INSTAGRAM_HOVER_PHOTO = "hover:border-[#f472b6] hover:text-[#f472b6]";

/** Current page, without query or hash. */
export function pageShareUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

export async function copyShareLink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(pageShareUrl());
    return true;
  } catch {
    // Non-secure context or denied permission — not worth erroring over.
    return false;
  }
}

export function openShareWindow(build: (url: string, title: string) => string, title: string) {
  const win = window.open(
    build(pageShareUrl(), title),
    "_blank",
    "noopener,noreferrer,width=600,height=520"
  );
  win?.focus();
}

/**
 * Instagram accepts links only from inside the app — there is no
 * `instagram.com/share?url=` endpoint to point a web page at. The honest
 * approximation is to put the link on the clipboard and open Instagram so the
 * next step is a paste. On phones `navigator.share` is the better route, since
 * Instagram shows up there as a real target.
 */
export async function shareToInstagram(): Promise<boolean> {
  const ok = await copyShareLink();
  window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  return ok;
}

/**
 * Surface the control sits on.
 *  - "surface"  normal card/page background; colours come from theme tokens.
 *  - "onPhoto"  a hero image or dark overlay. Theme tokens are WRONG here:
 *               `text-foreground` is near-black in light mode, which is how the
 *               post hero ended up with near-invisible icons. globals.css keeps
 *               --on-photo / --photo-overlay fixed across themes for this case.
 */
export type ShareTone = "surface" | "onPhoto";

/** Focus ring that reads on any of the four theme combinations. */
export const SHARE_FOCUS =
  "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * Shape and resting state lifted from BookmarkButton, so the share controls and
 * the bookmark read as one family: a ghost button — transparent border, muted
 * glyph — that grows a coloured outline and takes the same colour on its icon
 * when hovered. No fills anywhere.
 */
export const SHARE_BUTTON_BASE =
  "inline-flex items-center gap-1.5 rounded-none border-2 px-2 py-1 transition-colors duration-100";

export function shareRestingClasses(tone: ShareTone): string {
  return tone === "onPhoto"
    ? // The hero plate is dark whatever the theme, so muted-foreground is wrong
      // here — it is near-black in light mode. --on-photo stays fixed for this.
      "border-transparent text-on-photo/75"
    : "border-transparent text-muted-foreground";
}

export function channelHover(channel: ShareChannel, tone: ShareTone): string {
  return tone === "onPhoto" ? channel.hoverPhoto : channel.hoverSurface;
}
