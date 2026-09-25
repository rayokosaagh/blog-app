"use client";

import { BIO_MAX, SOCIAL_PLATFORMS, checkSocialUrl, type SocialPlatform } from "@/lib/authorProfile";

export type AuthorProfileValue = {
  bio: string;
  socials: Partial<Record<SocialPlatform, string>>;
};

/** Seed the form from what the API returned (socials is an untyped Json column). */
export function authorProfileFrom(user: { bio?: string | null; socials?: unknown }): AuthorProfileValue {
  const socials: AuthorProfileValue["socials"] = {};
  if (user.socials && typeof user.socials === "object" && !Array.isArray(user.socials)) {
    for (const p of SOCIAL_PLATFORMS) {
      const v = (user.socials as Record<string, unknown>)[p.key];
      if (typeof v === "string") socials[p.key] = v;
    }
  }
  return { bio: user.bio ?? "", socials };
}

/** Per-field problems, keyed by platform, for inline messages and blocking Save. */
export function authorProfileErrors(value: AuthorProfileValue) {
  const errors: Partial<Record<SocialPlatform | "bio", string>> = {};
  if (value.bio.trim().length > BIO_MAX) errors.bio = `Keep it to ${BIO_MAX} characters`;
  for (const p of SOCIAL_PLATFORMS) {
    const v = value.socials[p.key]?.trim();
    if (!v) continue;
    const checked = checkSocialUrl(p.key, v);
    if ("error" in checked) errors[p.key] = checked.error;
  }
  return errors;
}

/**
 * Bio + social link inputs, shared by the Account page and Dashboard → Users.
 * Styling comes from the host so it matches the surrounding form: the Account
 * page uses the site theme, the dashboard its own zinc palette.
 */
export default function AuthorProfileFields({
  value,
  onChange,
  inputClass,
  labelClass,
  hintClass,
  errorClass = "text-xs text-red-600 dark:text-red-400",
}: {
  value: AuthorProfileValue;
  onChange: (next: AuthorProfileValue) => void;
  inputClass: string;
  labelClass: string;
  hintClass: string;
  errorClass?: string;
}) {
  const errors = authorProfileErrors(value);
  const bioLength = value.bio.trim().length;

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="author-bio" className={labelClass}>
          Bio
        </label>
        <textarea
          id="author-bio"
          rows={3}
          value={value.bio}
          onChange={(e) => onChange({ ...value, bio: e.target.value })}
          placeholder="One or two sentences readers see under your posts."
          className={`${inputClass} resize-y`}
        />
        <div className="mt-1 flex justify-between gap-3">
          <span className={errors.bio ? errorClass : hintClass}>
            {errors.bio ?? "Shown in the “About the author” box at the end of each post."}
          </span>
          <span className={`${bioLength > BIO_MAX ? errorClass : hintClass} shrink-0 tabular-nums`}>
            {bioLength}/{BIO_MAX}
          </span>
        </div>
      </div>

      <div>
        <p className={labelClass}>Social links</p>
        <p className={`${hintClass} -mt-1 mb-3`}>Optional. Only filled-in links appear on your posts.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SOCIAL_PLATFORMS.map((p) => (
            <div key={p.key}>
              <div className="relative">
                <i
                  className={`bi ${p.icon} pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-60`}
                  aria-hidden
                />
                {/* type="text", not "url": native URL validation would block a
                    form over "x.com/handle", which checkSocialUrl accepts. */}
                <input
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  aria-label={p.label}
                  aria-invalid={Boolean(errors[p.key])}
                  value={value.socials[p.key] ?? ""}
                  onChange={(e) => onChange({ ...value, socials: { ...value.socials, [p.key]: e.target.value } })}
                  placeholder={p.placeholder}
                  className={`${inputClass} pl-9`}
                />
              </div>
              {errors[p.key] && <p className={`mt-1 ${errorClass}`}>{errors[p.key]}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
