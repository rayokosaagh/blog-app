/**
 * Author profile: the short bio and social links shown in the "About the
 * author" card on posts. Pure logic with no server imports, so the edit forms
 * can validate as you type and the API routes can enforce the same rules.
 */

export const BIO_MAX = 280;

export type SocialPlatform =
  | "website"
  | "x"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "youtube"
  | "github"
  | "tiktok";

export type Socials = Partial<Record<SocialPlatform, string>>;

/**
 * Display order, labels, Bootstrap Icons class, and the hosts each platform's
 * link must point at. `hosts: null` (website) accepts any host. The host
 * check is what stops a "LinkedIn" icon from linking somewhere else.
 */
export const SOCIAL_PLATFORMS: {
  key: SocialPlatform;
  label: string;
  icon: string;
  hosts: string[] | null;
  placeholder: string;
}[] = [
  { key: "website", label: "Website", icon: "bi-globe2", hosts: null, placeholder: "https://yoursite.com" },
  { key: "x", label: "X (Twitter)", icon: "bi-twitter-x", hosts: ["x.com", "twitter.com"], placeholder: "https://x.com/handle" },
  { key: "instagram", label: "Instagram", icon: "bi-instagram", hosts: ["instagram.com"], placeholder: "https://instagram.com/handle" },
  { key: "facebook", label: "Facebook", icon: "bi-facebook", hosts: ["facebook.com", "fb.com"], placeholder: "https://facebook.com/handle" },
  { key: "linkedin", label: "LinkedIn", icon: "bi-linkedin", hosts: ["linkedin.com"], placeholder: "https://linkedin.com/in/handle" },
  { key: "youtube", label: "YouTube", icon: "bi-youtube", hosts: ["youtube.com", "youtu.be"], placeholder: "https://youtube.com/@handle" },
  { key: "github", label: "GitHub", icon: "bi-github", hosts: ["github.com"], placeholder: "https://github.com/handle" },
  { key: "tiktok", label: "TikTok", icon: "bi-tiktok", hosts: ["tiktok.com"], placeholder: "https://tiktok.com/@handle" },
];

const PLATFORM_KEYS = new Set<string>(SOCIAL_PLATFORMS.map((p) => p.key));

/**
 * Normalise one link, or explain why it's rejected. A missing scheme is
 * forgiven ("x.com/handle" → "https://x.com/handle"); anything that isn't
 * http(s) — javascript:, data:, mailto: — is refused.
 */
export function checkSocialUrl(
  platform: SocialPlatform,
  raw: string,
): { url: string } | { error: string } {
  const value = raw.trim();
  const def = SOCIAL_PLATFORMS.find((p) => p.key === platform);
  if (!def) return { error: "Unknown platform" };

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(value);
  let parsed: URL;
  try {
    parsed = new URL(hasScheme ? value : `https://${value}`);
  } catch {
    return { error: "Enter a full link, e.g. " + def.placeholder };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { error: "Links must start with https://" };
  }
  if (value.length > 300) return { error: "That link is too long" };

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (def.hosts && !def.hosts.some((h) => host === h || host.endsWith(`.${h}`))) {
    return { error: `${def.label} links must be on ${def.hosts[0]}` };
  }
  return { url: parsed.toString() };
}

/**
 * Validate an untrusted { bio, socials } payload for saving. Empty strings
 * clear a field. Returns the values to store, or the first problem found.
 */
export function validateAuthorProfile(input: {
  bio?: unknown;
  socials?: unknown;
}): { ok: true; bio?: string | null; socials?: Socials | null } | { ok: false; error: string } {
  const out: { ok: true; bio?: string | null; socials?: Socials | null } = { ok: true };

  if (input.bio !== undefined) {
    if (input.bio !== null && typeof input.bio !== "string") return { ok: false, error: "Bio must be text" };
    const bio = (input.bio ?? "").trim();
    if (bio.length > BIO_MAX) return { ok: false, error: `Bio must be ${BIO_MAX} characters or fewer` };
    out.bio = bio || null;
  }

  if (input.socials !== undefined) {
    if (input.socials !== null && (typeof input.socials !== "object" || Array.isArray(input.socials))) {
      return { ok: false, error: "Invalid social links" };
    }
    const socials: Socials = {};
    for (const [key, value] of Object.entries((input.socials ?? {}) as Record<string, unknown>)) {
      if (!PLATFORM_KEYS.has(key)) return { ok: false, error: `Unknown platform "${key}"` };
      if (value === null || value === undefined || value === "") continue;
      if (typeof value !== "string") return { ok: false, error: "Social links must be text" };
      const checked = checkSocialUrl(key as SocialPlatform, value);
      if ("error" in checked) return { ok: false, error: checked.error };
      socials[key as SocialPlatform] = checked.url;
    }
    out.socials = Object.keys(socials).length > 0 ? socials : null;
  }

  return out;
}

/**
 * Read stored socials for display. Re-checks every link rather than trusting
 * the column, so a row edited outside the app can't put a bad URL on a post.
 * Returned in SOCIAL_PLATFORMS order.
 */
export function readSocials(stored: unknown): { key: SocialPlatform; label: string; icon: string; url: string }[] {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return [];
  const map = stored as Record<string, unknown>;
  return SOCIAL_PLATFORMS.flatMap((p) => {
    const value = map[p.key];
    if (typeof value !== "string") return [];
    const checked = checkSocialUrl(p.key, value);
    return "url" in checked ? [{ key: p.key, label: p.label, icon: p.icon, url: checked.url }] : [];
  });
}
