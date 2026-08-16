import { APP_URL } from "./appUrl";

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

// Post titles and image paths are author-supplied and land inside HTML
// attributes, where an unescaped quote would break out of the attribute and
// mangle the markup. Cheap to apply, and the only guard these templates have.
const escapeAttr = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// A bordered panel with a highlighter-yellow caption bar — the email-safe
// equivalent of a `border-2 border-border-heavy` card with a section header.
const panel = (caption: string, rowsHtml: string) => `
<table width="100%" cellpadding="0" cellspacing="0" style="border:3px solid ${BRAND.border};background:${BRAND.bg};">
  <tr>
    <td style="background:${BRAND.accent2};border-bottom:3px solid ${BRAND.border};padding:10px 18px;">
      <span style="font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.onAccent2};">
        ${caption}
      </span>
    </td>
  </tr>
  ${rowsHtml}
</table>
`;

// One numbered row inside `panel`. Two table cells rather than flex — Outlook's
// Word rendering engine ignores flexbox entirely.
const numberedRow = (n: number, title: string, body: string, last = false) => `
<tr>
  <td style="padding:16px 18px;${last ? "" : `border-bottom:2px solid ${BRAND.border};`}">
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td width="40" valign="top" style="width:40px;padding-right:14px;">
          <table cellpadding="0" cellspacing="0" style="background:${BRAND.ink};border:2px solid ${BRAND.border};">
            <tr>
              <td align="center" style="width:24px;height:24px;font-size:12px;font-weight:800;color:${BRAND.bg};line-height:24px;">
                ${n}
              </td>
            </tr>
          </table>
        </td>
        <td valign="top">
          <p style="margin:0 0 3px 0;font-size:14px;font-weight:800;color:${BRAND.ink};">${title}</p>
          <p style="margin:0;font-size:13px;line-height:1.55;color:${BRAND.muted};">${body}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>
`;

// Outlined chips for the topics a subscriber can expect to see.
const topicPill = (label: string) => `
<span style="display:inline-block;border:2px solid ${BRAND.border};background:${BRAND.bg};color:${BRAND.ink};font-size:11px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;padding:5px 11px;margin:0 6px 8px 0;">
  ${label}
</span>
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
    text: [
      "Confirm your subscription",
      "",
      "Thanks for signing up! Open the link below to confirm your email and start receiving updates.",
      "",
      confirmUrl,
      "",
      "If you didn't request this, you can safely ignore this email.",
    ].join("\n"),
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
  const topics = ["Android", "Apple", "Samsung", "Xiaomi", "Laptops", "Reviews"];

  return {
    subject: "You're subscribed 🎉",
    text: [
      "You're all set",
      "",
      "Your subscription is confirmed. Here's what lands in your inbox from here:",
      "",
      "1. New posts — reviews, launches and Nepal pricing, sent as they publish.",
      "2. No filler — one email per post. No digests, no promotions, no reselling your address.",
      "3. One click out — every email carries an unsubscribe link that works immediately.",
      "",
      `Read the latest posts: ${APP_URL}`,
      "",
      `Topics: ${topics.join(", ")}`,
      "",
      `Unsubscribe at any time: ${unsubscribeUrl}`,
    ].join("\n"),
    html: wrapper(`
      <tr>
        <td style="padding:40px 32px 0 32px;">
          ${tagPill("Subscribed")}
          <h1 style="margin:12px 0 12px 0;font-size:26px;line-height:1.25;color:${BRAND.ink};font-weight:800;">
            You're all set
          </h1>
          <p style="margin:0 0 26px 0;color:${BRAND.body};font-size:15px;line-height:1.6;">
            Your subscription is confirmed. Here's exactly what lands in your inbox from here.
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding:0 32px;">
          ${panel(
            "What to expect",
            [
              numberedRow(
                1,
                "New posts, as they publish",
                "Reviews, launches and Nepal pricing — sent when a post goes live, not on a schedule."
              ),
              numberedRow(
                2,
                "No filler",
                "One email per post. No digests, no promotions, and your address is never shared or sold."
              ),
              numberedRow(
                3,
                "One click out",
                "Every email carries an unsubscribe link that takes effect immediately.",
                true
              ),
            ].join("")
          )}
        </td>
      </tr>

      <tr>
        <td style="padding:28px 32px 0 32px;">
          ${brutalButton(APP_URL, "Read the latest posts", BRAND.accent, BRAND.onAccent)}
        </td>
      </tr>

      <tr>
        <td style="padding:30px 32px 0 32px;">
          <p style="margin:0 0 12px 0;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.faint};">
            What we cover
          </p>
          ${topics.map(topicPill).join("")}
        </td>
      </tr>

      <tr>
        <td style="padding:24px 32px 36px 32px;">
          <div style="border-top:3px solid ${BRAND.border};padding-top:18px;">
            <p style="margin:0;color:${BRAND.faint};font-size:12px;line-height:1.5;">
              Not what you signed up for?
              <a href="${unsubscribeUrl}" style="color:${BRAND.faint};font-weight:700;">Unsubscribe</a>
              — it takes effect straight away.
            </p>
          </div>
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
          <a href="${escapeAttr(params.url)}" style="display:block;">
            <img src="${escapeAttr(resolvedImage)}" alt="${escapeAttr(params.title)}" width="600"
              style="width:100%;max-width:600px;height:auto;display:block;border:0;outline:none;text-decoration:none;" />
          </a>
        </td>
      </tr>
    `
    : "";

  return {
    subject: params.title,
    text: [
      "New post",
      "",
      params.title,
      "",
      params.excerpt,
      "",
      `Read the full post: ${params.url}`,
      "",
      `Unsubscribe at any time: ${unsubscribeUrl}`,
    ].join("\n"),
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