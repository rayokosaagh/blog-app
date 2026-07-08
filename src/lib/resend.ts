import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn(
    "RESEND_API_KEY is not set. Newsletter emails will fail to send."
  );
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// e.g. "Your Blog <newsletter@yourdomain.com>" — must be a verified domain/sender in Resend
export const NEWSLETTER_FROM =
  process.env.RESEND_FROM_EMAIL ?? "Newsletter <onboarding@resend.dev>";

// Base URL used to build confirm/unsubscribe links, e.g. https://yourdomain.com
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";