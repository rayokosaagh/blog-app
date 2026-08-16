11<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# blog-app

Next.js 16 (Turbopack) / React 19 / Prisma 7 / Postgres / Auth.js v5 / Tailwind v4.
Tech blog + gadget spec-comparison site.

## Commands

```bash
npm run dev      # dev server on :3000
npm run build    # production build (see "Build" below)
npm run start    # production server
npm run db       # prisma dev start default
npx tsc --noEmit # typecheck — the build runs this too
npx eslint .     # NOT run by the build; see below
```

## Things that will bite you

**Prisma client is generated to `../generated/prisma`, not `@prisma/client`.**
`prisma/schema.prisma` sets `output = "../generated/prisma"`. Importing
`PrismaClient` from `@prisma/client` compiles to nothing useful and breaks at
runtime. Import from `@/generated/prisma` (types) or `../../generated/prisma`.

**ESLint does not run during `next build`.** Next 16 + Turbopack dropped it, so
the build passes with lint errors present (there are ~137 pre-existing ones in
`src/`). Run `npx eslint` yourself; the build will not catch regressions.
`generated/**` is not ignored by the eslint config, so ~1200 of the reported
problems come from the generated Prisma client — filter to `src/` for signal.

**`getExcerpt` in `src/lib/postUtils.ts` is the correct HTML-to-text helper.**
It replaces tags with a *space* before collapsing whitespace. Two hand-rolled
copies used `replace(/<[^>]*>/g, "")` with an empty string, which fuses the last
word of one block onto the first of the next ("Review Overview**T**he Xiaomi…").
Do not write a third one.

**`PATCH /api/polls/[id]` destroys votes if you send `options`.** The handler
deletes and recreates every option whenever an `options` array is present. To
change only the active flag, send `{ isActive }` alone — that takes the
simple-update branch and leaves votes intact.

**Server Components cannot import functions from a `"use client"` module.**
Every export of a client module becomes a client reference, so a plain function
arrives as an uncallable proxy and 500s the page. Pure logic shared between the
two lives in `src/lib/` (see `src/lib/blogSort.ts` next to
`src/components/blog/BlogSort.tsx`).

## Theming

`<html data-theme>` is `"modern"` or `"brutalist"`, set from the DB by
`getThemeSettings()`. Components are written with brutalist atoms
(`rounded-none`, `border-2`, `shadow-brutal`); `globals.css` has a compat layer
under `[data-theme='modern']` that rounds corners and hairlines borders.

That layer enumerates border widths explicitly — `border-2`, `border-4`,
`border-[3px]`, `border-[1.5px]`. **A new arbitrary border width will not be
rounded in modern theme until it is added to that selector**, which is how the
article footer ended up hard-cornered next to rounded cards. Prefer the
`surface-*` utilities over raw brutalist atoms in new code.

## Data model notes

- `Post.views` is incremented by `/api/posts/[id]/view` and **indexed** — it is
  the only engagement signal with real spread. Comments, ratings and bookmarks
  are all ~0 across the corpus, so "most discussed"/"top rated" features will
  render arbitrary results. Rank by `views`.
- The homepage dedupes its two feeds: `topStories` (4 by views) is fetched in
  `src/app/page.tsx` and its ids are filtered out of `recentPosts`, which is why
  that query takes 11 and slices to 7.
- `hasActivePoll` in `page.tsx` mirrors the `isActive` + `endsAt` condition in
  `/api/polls/active`. It controls whether the poll column is laid out at all —
  `<Poll />` returns null with no polls, but its grid track did not, leaving a
  dead column. Both the 3-column and 2-column layouts are live code paths.

## Before deploying

- **`NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` must point at the real domain.**
  Canonicals, OG URLs, JSON-LD and `sitemap.xml` are all built from
  `NEXT_PUBLIC_APP_URL` (via `src/lib/appUrl.ts`). Left at localhost, the SEO
  work is inert.
- `trustHost: true` in `src/auth/index.ts` is required for self-hosted
  production — without it every `/api/auth/session` request 500s with
  `UntrustedHost` under `next start`. It never reproduces under `next dev`.
  Safe only while the callback origin stays pinned by `NEXTAUTH_URL`.

## Auditing

`tools/audit/` holds Playwright scripts used to check the rendered site
(console/page errors, metadata, tap targets, layout overflow, column
alignment). See `tools/audit/README.md`. Run against a server you started
yourself — a `next build` will disrupt a running `next dev`, since they share
`.next`.

## Known outstanding

- Author display names are placeholders (`Hello`, `Hello0`, `hello`).
- ~137 eslint errors in `src/` (mostly `no-explicit-any`, unused vars).
- Debug `console.log`s left in `src/app/blog/[slug]/page.tsx`.
- Article-body images have no `alt` — the editor should require it.
- No default OG image; only posts and products have one.
- Homepage above-the-fold is entirely the promo carousel; the popup
  interstitial fires at ~22s (Google penalises intrusive interstitials).
