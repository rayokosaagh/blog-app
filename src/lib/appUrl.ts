/**
 * Base URL used to build confirm/unsubscribe links and absolute image paths in
 * emails, e.g. https://yourdomain.com
 *
 * Deliberately NOT inside lib/email/send.ts: that module is `server-only`, and
 * this is a public value (NEXT_PUBLIC_*). Keeping it separate means email
 * templates can be imported and previewed outside a server runtime without
 * dragging the SMTP transport — and its credentials — along with them.
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
