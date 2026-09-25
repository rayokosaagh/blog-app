// Where to send a visitor after sign-in, and the /login link that carries it.
// Pure functions (no "use client") so server and client code can both use them.

/**
 * `callbackUrl` as a same-site path, or "/" if it isn't one. The value comes
 * from the query string, so anything a link can say reaches here: only a path
 * starting with a single "/" is accepted. "//evil.com" and "/\evil.com" are
 * protocol-relative to browsers, and "https://…" is another site outright —
 * following either would make /login an open redirect.
 */
export function safeCallbackUrl(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/")) return "/";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  return raw;
}

/** `/login`, returning the visitor to `returnTo` (a same-site path) afterwards. */
export function loginHref(returnTo: string): string {
  const path = safeCallbackUrl(returnTo);
  return path === "/" ? "/login" : `/login?callbackUrl=${encodeURIComponent(path)}`;
}
