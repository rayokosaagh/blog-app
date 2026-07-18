import { APP_URL } from "./resend";

// Shared brand tokens — mirrors globals.css light-mode values. Email is
// always sent in light mode regardless of the recipient's client theme,
// so these are the only colors that matter. Kept as flat hex because
// email clients don't reliably support CSS custom properties.
const BRAND = {
  ink: "#0e1116", // --foreground
  body: "#0e1116",
  muted: "#4b5566", // --muted-foreground
  faint: "#8a8f99",
  border: "#000000", // --border-heavy
  bg: "#ffffff", // --background
  accent: "#2563eb", // --accent (light)
  onAccent: "#ffffff", // --on-accent
  accent2: "#ffe500", // --accent-2 (light)
  onAccent2: "#000000", // --on-accent-2
};

// Email clients can't render box-shadow reliably (Outlook desktop strips
// it entirely), so the brutal offset-shadow is faked with a background
// table: a solid black block sits behind the content, offset by padding
// on the outer cell — same visual result as shadow-brutal, table-safe.
const brutalBlock = (innerHtml: string, offset = 6) => `
<table cellpadding="0" cellspacing="0" style="background:${BRAND.border};">
  <tr>
    <td style="padding:0 ${offset}px ${offset}px 0;">
      <table width="600" cellpadding="0" cellspacing="0" style="width:600px;background:${BRAND.bg};border:3px solid ${BRAND.border};">
        ${innerHtml}
      </table>
    </td>
  </tr>
</table>
`;

// Same offset-shadow trick, scaled down, for buttons.
const brutalButton = (href: string, label: string, bg: string, color: string) => `
<table cellpadding="0" cellspacing="0" style="background:${BRAND.border};">
  <tr>
    <td style="padding:0 4px 4px 0;">
      <a href="${href}" style="display:block;background:${bg};color:${color};border:2px solid ${BRAND.border};padding:12px 26px;text-decoration:none;font-weight:800;font-size:13px;letter-spacing:0.03em;text-transform:uppercase;">
        ${label}
      </a>
    </td>
  </tr>
</table>
`;

const tagPill = (label: string) => `
<span style="display:inline-block;background:${BRAND.accent2};color:${BRAND.onAccent2};font-size:11px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;padding:5px 12px;border:2px solid ${BRAND.border};margin-bottom:16px;">
  ${label}
</span>
`;

const wrapper = (bodyHtml: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
  </head>
  <body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
      <tr>
        <td align="center">
          ${brutalBlock(`
            <tr>
              <td style="padding:24px 32px;border-bottom:3px solid ${BRAND.border};">
                <span style="font-size:15px;font-weight:800;color:${BRAND.ink};letter-spacing:0.02em;text-transform:uppercase;">
                  Your Blog
                </span>
              </td>
            </tr>
            ${bodyHtml}
          `)}

          <p style="color:${BRAND.faint};font-size:12px;margin-top:24px;line-height:1.5;">
            You're receiving this because you subscribed at ${APP_URL.replace(/^https?:\/\//, "")}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export function confirmSubscriptionEmail(token: string) {
  const confirmUrl = `${APP_URL}/api/newsletter/confirm?token=${token}`;
  return {
    subject: "Confirm your subscription",
    html: wrapper(`
      <tr>
        <td style="padding:40px 32px;">
          <h1 style="margin:0 0 12px 0;font-size:22px;color:${BRAND.ink};font-weight:800;">
            Confirm your subscription
          </h1>
          <p style="margin:0 0 28px 0;color:${BRAND.body};font-size:15px;line-height:1.6;">
            Thanks for signing up! Click the button below to confirm your email and start receiving updates.
          </p>
          ${brutalButton(confirmUrl, "Confirm subscription", BRAND.accent, BRAND.onAccent)}
          <p style="margin:24px 0 0 0;color:${BRAND.muted};font-size:13px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </td>
      </tr>
    `),
  };
}

export function welcomeEmail(token: string) {
  const unsubscribeUrl = `${APP_URL}/api/newsletter/unsubscribe?token=${token}`;
  return {
    subject: "You're subscribed 🎉",
    html: wrapper(`
      <tr>
        <td style="padding:40px 32px;">
          <h1 style="margin:0 0 12px 0;font-size:22px;color:${BRAND.ink};font-weight:800;">
            You're all set
          </h1>
          <p style="margin:0 0 8px 0;color:${BRAND.body};font-size:15px;line-height:1.6;">
            Your subscription is confirmed. You'll now get new posts and updates straight to your inbox.
          </p>
          <p style="margin:24px 0 0 0;color:${BRAND.faint};font-size:12px;">
            <a href="${unsubscribeUrl}" style="color:${BRAND.faint};font-weight:700;">Unsubscribe</a> at any time.
          </p>
        </td>
      </tr>
    `),
  };
}

export function newPostNotificationEmail(params: {
  title: string;
  excerpt: string;
  url: string;
  token: string;
  featuredImage?: string | null;
}) {
  const unsubscribeUrl = `${APP_URL}/api/newsletter/unsubscribe?token=${params.token}`;

  const resolvedImage = params.featuredImage
    ? params.featuredImage.startsWith("http")
      ? params.featuredImage
      : `${APP_URL}${params.featuredImage.startsWith("/") ? "" : "/"}${params.featuredImage}`
    : null;

  const heroImage = resolvedImage
    ? `
      <tr>
        <td style="border-bottom:3px solid ${BRAND.border};">
          <a href="${params.url}" style="display:block;">
            <img src="${resolvedImage}" alt="${params.title}" width="600"
              style="width:100%;max-width:600px;height:280px;object-fit:cover;display:block;" />
          </a>
        </td>
      </tr>
    `
    : "";

  return {
    subject: params.title,
    html: wrapper(`
      ${heroImage}
      <tr>
        <td style="padding:32px 32px 40px 32px;">
          ${tagPill("New Post")}
          <h1 style="margin:12px 0 12px 0;font-size:24px;line-height:1.3;color:${BRAND.ink};font-weight:800;">
            ${params.title}
          </h1>
          <p style="margin:0 0 28px 0;color:${BRAND.body};font-size:15px;line-height:1.6;">
            ${params.excerpt}
          </p>
          ${brutalButton(params.url, "Read the full post →", BRAND.accent, BRAND.onAccent)}
          <p style="margin:32px 0 0 0;padding-top:20px;border-top:3px solid ${BRAND.border};color:${BRAND.faint};font-size:12px;">
            <a href="${unsubscribeUrl}" style="color:${BRAND.faint};font-weight:700;">Unsubscribe</a> at any time.
          </p>
        </td>
      </tr>
    `),
  };
}