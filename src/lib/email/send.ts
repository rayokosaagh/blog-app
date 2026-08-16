import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

/**
 * Outbound mail.
 *
 * One function, one seam. Everything that needs to send something composes an
 * `OutgoingEmail` and hands it here; swapping providers is an edit to
 * `sendEmail`/`getTransporter` below and nothing else.
 *
 * Delivery goes through Gmail's SMTP over nodemailer, authenticated with a
 * Google App Password (not the account password — Gmail rejects plain
 * passwords for SMTP once 2-Step Verification is on, which it must be to
 * generate one). `service: "gmail"` resolves host and port itself, so no
 * GMAIL_HOST/PORT is needed.
 *
 * This is the same configuration the Ecom project uses (src/lib/email/send.ts
 * there), minus its inline-attachment handling — this blog's templates
 * reference images by absolute URL rather than by `cid:`, so there is nothing
 * to attach.
 */

export type OutgoingEmail = {
  to: string;
  subject: string;
  /** Always provide both — some clients refuse to render HTML-only mail. */
  text: string;
  html: string;
};

/**
 * What "sending worked" means to a caller. Deliberately advisory: something to
 * log, not something to leak to a visitor — the subscribe endpoint must not
 * vary its response on whether an address exists or delivery succeeded.
 */
export type SendResult = { ok: true } | { ok: false; error: string };

let transporter: Transporter | null = null;

/**
 * Built once and reused — nodemailer's SMTP transport pools connections
 * internally, and re-creating it per send would throw that away for nothing.
 */
function getTransporter(user: string, appPassword: string): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass: appPassword },
    });
  }
  return transporter;
}

/**
 * Send a message, or write it to the log when no provider is configured.
 *
 * The console fallback is the development path, and it is a feature rather
 * than a stub: the whole subscribe/confirm flow can be exercised end to end —
 * including clicking the real link — without a Google account, an app
 * password, or a mail server. Set GMAIL_USER and GMAIL_PASSWORD to switch to
 * real delivery.
 */
export async function sendEmail(message: OutgoingEmail): Promise<SendResult> {
  const user = process.env.GMAIL_USER?.trim();
  const appPassword = process.env.GMAIL_PASSWORD?.trim();
  const from = process.env.EMAIL_FROM?.trim() || user;

  if (!user || !appPassword || !from) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[email] GMAIL_USER and GMAIL_PASSWORD are not set — no mail was sent."
      );
      return { ok: false, error: "Email is not configured." };
    }

    console.info(
      [
        "",
        "──────────────── email (not configured — logged instead) ────────────────",
        `To:      ${message.to}`,
        `Subject: ${message.subject}`,
        "",
        message.text,
        "─────────────────────────────────────────────────────────────────────────",
        "",
      ].join("\n")
    );
    return { ok: true };
  }

  try {
    await getTransporter(user, appPassword).sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    return { ok: true };
  } catch (error) {
    // A network or auth failure must not take down the request that triggered
    // it. Worth logging in full — it is the difference between "my app
    // password is wrong" and "Gmail is rate-limiting me", and both look
    // identical otherwise.
    console.error("[email] delivery failed", error);
    return { ok: false, error: "Delivery failed." };
  }
}
