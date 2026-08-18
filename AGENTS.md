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
- **Two different "ratings" exist.** `Rating` rows are readers'; `Post.verdict*`
  is the editor's. Only the editorial one feeds the Review JSON-LD. Read it
  through `readVerdict()` in `src/lib/verdict.ts`, never off the columns
  directly — it requires **both** a written `verdictSummary` and a score before
  anything renders, so a bare score publishes nothing. A null score means "not
  a scored review", never zero, and sub-scores average into an absent overall.
- `Comparison.verdictA/verdictB` is the editor-written summary for one curated
  pair, shown above the spec table on /compare. `/compare` allows any 2–3
  products, so most pairings have none and the card renders nothing —
  **deliberately**. There was a fallback that assembled a summary from spec
  deltas; it was removed because a sentence generated from a table still reads
  as the publication's opinion, and attributing an opinion to the publication
  that nobody there held is worse than showing nothing. Don't reintroduce it.
  `lookupEditorVerdicts` only matches pairs, so a 3-way comparison never has one.

## Client-side state

Two features are localStorage-backed rather than DB-backed, because they matter
most to readers who never sign in: the compare tray and reading history.

**Read them through `createLocalStore` + `useSyncExternalStore`, never with a
`useState` + `useEffect` pair.** The eslint config has
`react-hooks/set-state-in-effect` on as an *error*, so the "hydrate from
storage in an effect" pattern will not lint. `getSnapshot` must return a cached
reference until the value actually changes, and the server snapshot must be a
shared constant (`EMPTY`), or React loops on "getSnapshot should be cached".

## Spec values are free text

`Product.specs` is hand-entered JSON, and almost nothing in it is clean. The
helpers that exist because of it:

- `isSpecEmpty` / `groupHasValues` (`formatSpecValue.ts`) — an untouched field
  arrives as `" "`, not `""`. `raw !== ""` treats that as a real value.
- `normalizeSpecToken` (`productFilters.ts`) — "12" and "12GB" are the same
  facet option; without it the dropdown lists both.
- `computeSpecFacets` returns `needsCategory: true` when the rows in scope span
  categories, and no facets. `FILTERABLE_SPECS` covers all four categories and
  the labels repeat (`chipset` and `processorModel` both render as
  "Processor"), so an unscoped listing showed Processor/RAM/Storage twice.
The lesson those encode: **don't compute editorial claims from this data.** It
is inconsistent enough that any sentence derived from it is a guess wearing the
publication's voice. Filters and facets are fine; opinions are not.

## Before deploying

- **`NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` must point at the real domain.**
  Canonicals, OG URLs, JSON-LD and `sitemap.xml` are all built from
  `NEXT_PUBLIC_APP_URL` (via `src/lib/appUrl.ts`). Left at localhost, the SEO
  work is inert.
- `trustHost: true` in `src/auth/index.ts` is required for self-hosted
  production — without it every `/api/auth/session` request 500s with
  `UntrustedHost` under `next start`. It never reproduces under `next dev`.
  Safe only while the callback origin stays pinned by `NEXTAUTH_URL`.
- The service worker (`public/sw.js`) only registers in production —
  `ServiceWorkerRegistrar` unregisters any stale one under `next dev`, where a
  worker intercepts Turbopack's HMR and RSC requests. Bump `CACHE_VERSION` in
  `sw.js` to evict caches on the next activation.
- There is **no in-page install prompt** — deliberately removed. The manifest
  and worker stay, so the browser's own affordance still offers installation;
  don't re-add a `beforeinstallprompt` banner without asking.
- `tools/make-icons.js` regenerates `public/icons/*` (committed). Font-free by
  design: the rasteriser has no guaranteed font stack, and a missing face
  renders as blank space rather than failing.

## Auditing

`tools/audit/` holds Playwright scripts used to check the rendered site
(console/page errors, metadata, tap targets, layout overflow, column
alignment). See `tools/audit/README.md`. Run against a server you started
yourself — a `next build` will disrupt a running `next dev`, since they share
`.next`.

## Known outstanding

- **No product has a `priceFrom`**, so every card reads "See price" and the
  "Under Rs 25K/50K/100K" quick filters can never match. The rendering is
  correct; the data is missing.
- Junk spec data on "Iphone 18" (`chipset: "5345"`, `storage: "asdfsa"`,
  `screenSize: "3354"`) leaks into the /products facet dropdowns. Normalizing
  can't fix a value that isn't a value — fix it in the dashboard.
- Footer `About` / `Advertise with us` / `Privacy Policy` / `Contact` are still
  `href="#"`, and `Newsletter` points at `/newsletter`, which 404s.
- Author display names are placeholders (`Hello`, `Hello0`, `hello`).
- ~137 eslint errors in `src/` (mostly `no-explicit-any`, unused vars).
- Debug `console.log`s left in `src/app/blog/[slug]/page.tsx`.
- Article-body images have no `alt` — the editor should require it.
- No default OG image; only posts and products have one.
- Homepage above-the-fold is entirely the promo carousel; the popup
  interstitial fires at ~22s (Google penalises intrusive interstitials).
