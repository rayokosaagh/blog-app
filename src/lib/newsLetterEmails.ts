import { APP_URL } from "./resend";

// Shared brand tokens — keep these in sync with the dashboard's Tailwind palette
const BRAND = {
  blue: "#2563eb",
  blueDark: "#1d4ed8",
  ink: "#111827",
  body: "#374151",
  muted: "#6b7280",
  faint: "#9ca3af",
  border: "#e5e7eb",
  bg: "#f3f4f6",
};

const wrapper = (bodyHtml: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

            <!-- Brand header -->
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid ${BRAND.border};">
                <span style="font-size:16px;font-weight:700;color:${BRAND.ink};letter-spacing:-0.01em;">
                  📬 Your Blog
                </span>
              </td>
            </tr>

            ${bodyHtml}

          </table>

          <p style="color:${BRAND.faint};font-size:12px;margin-top:20px;line-height:1.5;">
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
          <h1 style="margin:0 0 12px 0;font-size:22px;color:${BRAND.ink};font-weight:700;">
            Confirm your subscription
          </h1>
          <p style="margin:0 0 28px 0;color:${BRAND.body};font-size:15px;line-height:1.6;">
            Thanks for signing up! Click the button below to confirm your email and start receiving updates.
          </p>
          <a href="${confirmUrl}" style="background:${BRAND.blue};color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
            Confirm subscription
          </a>
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
          <h1 style="margin:0 0 12px 0;font-size:22px;color:${BRAND.ink};font-weight:700;">
            You're all set
          </h1>
          <p style="margin:0 0 8px 0;color:${BRAND.body};font-size:15px;line-height:1.6;">
            Your subscription is confirmed. You'll now get new posts and updates straight to your inbox.
          </p>
          <p style="margin:24px 0 0 0;color:${BRAND.faint};font-size:12px;">
            <a href="${unsubscribeUrl}" style="color:${BRAND.faint};">Unsubscribe</a> at any time.
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

  // Email clients have no "current domain" to resolve relative paths against,
  // so a value like "/uploads/foo.jpg" must be turned into a full URL here.
  const resolvedImage = params.featuredImage
    ? params.featuredImage.startsWith("http")
      ? params.featuredImage
      : `${APP_URL}${params.featuredImage.startsWith("/") ? "" : "/"}${params.featuredImage}`
    : null;

  const heroImage = resolvedImage
    ? `
      <tr>
        <td>
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
          <span style="display:inline-block;background:#eff6ff;color:${BRAND.blue};font-size:12px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;padding:5px 12px;border-radius:999px;margin-bottom:16px;">
            New Post
          </span>
          <h1 style="margin:12px 0 12px 0;font-size:24px;line-height:1.3;color:${BRAND.ink};font-weight:700;">
            ${params.title}
          </h1>
          <p style="margin:0 0 28px 0;color:${BRAND.body};font-size:15px;line-height:1.6;">
            ${params.excerpt}
          </p>
          <a href="${params.url}" style="background:${BRAND.blue};color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
            Read the full post →
          </a>
          <p style="margin:32px 0 0 0;padding-top:20px;border-top:1px solid ${BRAND.border};color:${BRAND.faint};font-size:12px;">
            <a href="${unsubscribeUrl}" style="color:${BRAND.faint};">Unsubscribe</a> at any time.
          </p>
        </td>
      </tr>
    `),
  };
}