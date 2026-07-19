# Blog-app Audit Report

Audited across security/auth, Next.js 16 correctness, and frontend/code quality. Framework
APIs were checked against `node_modules/next/dist/docs/`.

**What's already solid:** async `params`/`searchParams`, `cookies()`/`headers()`,
`generateMetadata`, and the Prisma singleton are all correct. `.env` is gitignored (no committed
secrets), bcrypt is used properly, ownership checks on `posts/[id]` and `comments/[id]` are
correct, and the raw SQL in `blog/page.tsx` is parameterized (no injection).

---

## 🔴 Build & render breakers — fix before anything else

| # | Problem | Location |
|---|---------|----------|
| 1 | **`next build` is broken.** Reads `post.excerpt`, but the `Post` model has no `excerpt` field → TS2339 under `strict: true`. | `api/newsletter/notify/route.ts:26`, `lib/notifySubscribers.ts:13,29` |
| 2 | **`btoa()` crashes the post render** on any non-Latin1 char (em-dash, curly quote, emoji) in a table → `InvalidCharacterError`, 500s the page. | `blog/[slug]/page.tsx:187` |
| 3 | **Uncommitted debug hack:** a hardcoded Xiaomi image URL replaces `resolvedImage`, so every post-notification email shows the same wrong image. | `lib/newsLetterEmails.ts:153` |

---

## 🔴 Critical security — authorization

`middleware.ts` only guards `/dashboard/*`, **not `/api/*`** — so every API route must
self-protect, and many don't:

- **Fully unauthenticated CRUD** (anyone anonymous can create/edit/delete): all **gadgets**
  endpoints (`products`, `products/[id]`, `comparisons`, `comparisons/[id]`,
  `comparisons/reorder`, `compare`) and all **socials** endpoints (`route.ts`, `[id]/route.ts`).
- **Auth commented out** with `// Uncomment later`: `api/popup-ads/[id]/route.ts:41,83`
  (edit/delete any popup ad).
- **Stored XSS:** `api/socials` saves `iconSvg` **raw** — unlike `api/tags`, it skips the existing
  `sanitizeSvg()`. An anonymous attacker can persist a `<script>`/`onload=` payload rendered to
  every visitor.
- **Password-hash disclosure:** `include: { author: true }` on the **public** `GET /api/posts/[id]`
  (and `/api/posts`) returns the author's bcrypt hash + email. `api/users` POST/GET also return
  the hash.
- **Missing role checks** (any OAuth `READER` can act): post create, newsletter blast
  (`api/newsletter/notify`), tag CRUD, popup-ad create, and file upload.

**Fix pattern** (mirror `api/posts/[id]/route.ts:27`) at the top of each mutating handler:
```ts
const session = await auth();
if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
```

---

## 🟠 High / Medium security

- **Upload path traversal** (`api/upload/route.ts:39`): filename keeps `/` and `..`, so
  `../../evil.html` escapes `public/uploads`. Type check trusts client `file.type` (spoofable).
  → random UUID name + whitelisted extension.
- **No rate limiting:** newsletter signup (`api/newsletter/route.ts` → email bombing / Resend quota
  abuse) and credential login (`auth/index.ts:18` → brute force).
- **No input validation:** bodies destructured raw from `req.json()`; link fields in
  ads/banners/socials are rendered as `href`/`src` unvalidated → `javascript:` injection.
- **PII in logs:** `api/newsletter/confirm/route.ts` logs tokens + subscriber rows every hit.
- **Weak tokens (low):** one `cuid()` token used for both confirm and unsubscribe, via
  state-changing GET (prefetchable).

---

## 🟠 Correctness / robustness

- **No error boundaries anywhere** (no `error.tsx`/`global-error.tsx`) — any Prisma failure shows
  the framework default page.
- **Poll vote race** (`api/polls/[id]/vote/route.ts:29`): check-then-insert → concurrent votes 500
  on the unique constraint instead of 409.
- **Dead cache config:** `export const revalidate = 60` on `app/page.tsx` and
  `product/[slug]/page.tsx` does nothing — both call `auth()` (cookies → always dynamic). The
  "never >60s stale" comment is inaccurate.
- **Perf:** homepage server components issue overlapping Prisma queries (no `cache()` dedup);
  dashboard `groupBy: ["createdAt"]` groups by millisecond timestamps.

---

## 🟡 Frontend / code quality

- **Fake demo posts ship to prod:** `AnimatedPostsGrid.tsx:33` — `showDemoPosts` defaults `true`,
  padding the feed with fabricated articles/authors linking to 404 `/blog/dummy-post-N`.
- **Misnamed file:** `src/app/loadingl.tsx` should be `loading.tsx` — the skeleton is dead code,
  loading UX never shows.
- **Committed junk:** `blog/[slug]/New Text Document.txt` (23 KB stale copy) and `lib/mosiac`
  (31 KB).
- **Debug logging** in the blog render path (`blog/[slug]/page.tsx:203-295`, plus `prisma as any`);
  29 `console.log`s repo-wide.
- **Redundant dependency:** both `framer-motion` and `motion` (same lib, 63 import sites).
- **UX/a11y batch:** ~30 raw `<img>` instead of `next/image`; `alert()`/`confirm()` for errors;
  no double-submit guard on the poll form; silent bookmark-removal failure; form inputs without
  labels; toolbar buttons with emoji + `title` but no `aria-label`. (`GadgetProductForm`,
  `BookmarkButton`, `PopupAd` are good in-repo references.)

---

## Recommended order

1. **Build/render breakers** (§ top) — unblocks `next build` and post rendering.
2. **Critical authorization** — close the open/unauthenticated admin API endpoints.
3. High/medium security hardening → correctness → frontend/a11y sweep.

## Verification

- `npx tsc --noEmit` and `npm run build` — must pass (fails today on the `excerpt` error).
- `npm run lint`.
- `curl -X POST /api/socials` with no session → expect 403, not 200.
- Load a blog post with a table containing an em-dash/emoji → must render.
- Vote twice concurrently on one poll → 409, not 500.
