# blog-app

A tech publication and gadget database: long-form reviews and news alongside a
structured spec catalogue for phones, laptops, smartwatches and earbuds, with a
side-by-side comparison tool. Everything — articles, products, ads, polls,
newsletter and site theming — is managed from a built-in dashboard.

Built with Next.js 16 (App Router, Turbopack), React 19, Prisma 7 on Postgres,
Auth.js v5 and Tailwind v4.

## Features

**Publishing** — TipTap rich-text editor with custom content blocks that are
authored inline and rendered as React components: image galleries, key
highlights, pros/cons, spec tables, "also read" cards, plus shortcodes that
place inline ads and banners mid-article.

**Reading** — tag and author filtering, multi-field search across title, body,
tags and author, sorting by newest/oldest/most-read, reading time, table of
contents, reading-progress bar, bookmarks, ratings and moderated comments.

**Gadgets** — products carry category-specific spec schemas (one per category),
colour variants with per-colour photos, and starting prices. Any two can be put
head-to-head in the comparison view, and editors can publish curated
comparisons.

**Engagement** — polls, newsletter with double opt-in and unsubscribe, social
links, and four ad surfaces (inline, banner, spotlight rail, popup).

**Theming** — two complete site themes (`brutalist` and `modern`) selectable at
runtime, each with admin-configurable accent colours and dark mode.

**SEO** — per-page metadata and canonicals, `BlogPosting` and `Product`
structured data, a database-driven `sitemap.xml` and `robots.txt`.

## Setup

Requires Node 20+ and a running PostgreSQL 17 instance.

The app connects as a dedicated, unprivileged role rather than the `postgres`
superuser, so a bug or injection cannot reach the other databases on the same
server. Create the role and its two databases once, as the superuser:

```bash
psql -U postgres -c "CREATE ROLE blog_app LOGIN PASSWORD 'pick-a-password'"
psql -U postgres -c "CREATE DATABASE blog_app OWNER blog_app"
psql -U postgres -c "CREATE DATABASE blog_app_shadow OWNER blog_app"
```

`blog_app_shadow` is a persistent database rather than one Prisma creates per
run: the app role deliberately lacks `CREATEDB`, so `prisma migrate` cannot
conjure a shadow database the way a superuser would.

```bash
npm install
npx prisma generate          # client is emitted to ./generated/prisma
npx prisma migrate dev
npm run dev                  # http://localhost:3000
```

### Environment

Create `.env`:

```ini
DATABASE_URL=postgresql://...
SHADOW_DATABASE_URL=postgresql://...

AUTH_SECRET=            # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=

GMAIL_USER=             # newsletter delivery over SMTP
GMAIL_PASSWORD=         # Gmail app password, not the account password
EMAIL_FROM=
```

Sign-in supports email/password, Google and GitHub.

> **Before deploying, point `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` at the real
> domain.** Canonicals, OG tags, JSON-LD and the sitemap are all built from the
> former, so leaving it on localhost tells search engines your pages live there.
> The latter pins the auth callback origin, which is what makes `trustHost`
> safe.

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (runs TypeScript, **not** ESLint) |
| `npm run start` | Production server |
| `npm run db` | `prisma dev start default` |
| `npx tsc --noEmit` | Typecheck |
| `npx eslint .` | Lint — not run by the build, so run it yourself |

## Auditing

`tools/audit/` holds Playwright scripts that render the real site and report
console errors, metadata gaps, undersized tap targets, layout overflow and
column misalignment. See [tools/audit/README.md](tools/audit/README.md).

Run them against a server you started yourself — a `next build` will disrupt a
running `next dev`, since the two share `.next`.

## Things that will bite you

**The Prisma client is generated to `../generated/prisma`, not
`@prisma/client`.** `prisma/schema.prisma` sets `output = "../generated/prisma"`.
Importing `PrismaClient` from `@prisma/client` compiles to nothing useful and
breaks at runtime. Import from `@/generated/prisma` for types.

**ESLint does not run during `next build`.** Next 16 + Turbopack dropped it, so
the build passes with lint errors present. Run `npx eslint` yourself; the build
will not catch regressions. `generated/**` is not excluded by the eslint config,
so most reported problems come from the generated Prisma client — filter to
`src/` for signal.

**`getExcerpt` in `src/lib/postUtils.ts` is the correct HTML-to-text helper.**
It replaces tags with a *space* before collapsing whitespace. Hand-rolled copies
using `replace(/<[^>]*>/g, "")` fuse the last word of one block onto the first of
the next ("Review Overview**T**he Xiaomi…"). Don't write a third one.

**`PATCH /api/polls/[id]` destroys votes if you send `options`.** The handler
deletes and recreates every option row whenever an `options` array is present.
To change only the active flag, send `{ isActive }` alone — that takes the
simple-update branch and leaves votes intact.

**Server Components cannot import functions from a `"use client"` module.**
Every export of a client module becomes a client reference, so a plain function
arrives as an uncallable proxy and 500s the page. Pure logic shared between the
two lives in `src/lib/` — see `src/lib/blogSort.ts` beside
`src/components/blog/BlogSort.tsx`.

## Theming

`<html data-theme>` is `"modern"` or `"brutalist"`, set from the database by
`getThemeSettings()`. Components are written with brutalist atoms
(`rounded-none`, `border-2`, `shadow-brutal`); `globals.css` carries a compat
layer under `[data-theme='modern']` that rounds corners and thins borders.

That layer enumerates border widths explicitly — `border-2`, `border-4`,
`border-[3px]`, `border-[1.5px]`. **A new arbitrary border width will not be
rounded in the modern theme until it is added to that selector**, which is how
the article footer ended up hard-cornered beside rounded cards. Prefer the
`surface-*` utilities over raw brutalist atoms in new code.

**Section headers use `<SectionHeader>`** (`src/components/ui/SectionHeader.tsx`)
and nothing else — icon chip, eyebrow, title, subtitle, optional "see all" pill.
Every homepage section is that component; don't hand-roll one with its own
`text-3xl`. Its type comes from the heading-role tokens (`.h-section`,
`.h-eyebrow`, `src/lib/typography.ts`), which admins retune per theme under
Dashboard → UI settings → Heading typography. A Tailwind size class on a heading
silently opts it out of that. `as` sets the outline level only: top-level
sections are `h2`, columns and rails inside one are `h3`, card titles `h-card`.

## Data model notes

**Posts have one `category` and many `tags`.** `Post.category` is the
`PostCategory` enum (NEWS, REVIEW, VERSUS, DEAL, GUIDE); the display registry is
`src/lib/blog/categories.ts` — slug, label, icon, description — and it is the
*only* place those live. Adding a category means an enum value in
`schema.prisma` plus an entry there; the landing page, its RSS feed, the navbar,
the `/blog` tabs, sitemap, dashboard select and card badges all read the
registry. Category slugs are **root routes** (`/news`, `/reviews`, `/versus`,
`/deals`, `/guides`), so a new `src/app/<segment>` must not collide with
`POST_CATEGORY_SLUGS`.

**Rank by `views`.** `Post.views` is incremented by `/api/posts/[id]/view` and
indexed — it is the only engagement signal with real spread. Comments, ratings
and bookmarks are all near zero across the corpus, so "most discussed" or "top
rated" features render arbitrary results.

**Two different "ratings" exist.** `Rating` rows are readers'; `Post.verdict*` is
the editor's. Only the editorial one feeds the Review JSON-LD. Read it through
`readVerdict()` in `src/lib/verdict.ts`, never off the columns directly — it
requires **both** a written `verdictSummary` and a score before anything renders,
so a bare score publishes nothing. A null score means "not a scored review",
never zero, and sub-scores average into an absent overall.

`Product.verdict*` is the same three columns under the same rules, written in the
gadget dashboard via the shared `VerdictEditor`. It feeds the homepage "Editor's
verdicts" scoreboard, the `VerdictCard` on `/product/[slug]`, and a nested
`review` in that page's Product JSON-LD.

`Comparison.verdictA/verdictB` is the editor-written summary for one curated
pair, shown above the spec table on `/compare`. Most pairings have none and the
card renders nothing — **deliberately**. A previous fallback assembled a summary
from spec deltas; it was removed because a sentence generated from a table still
reads as the publication's opinion, and attributing an opinion to the
publication that nobody there held is worse than showing nothing. Don't
reintroduce it.

## Client-side state

The compare tray and reading history are localStorage-backed rather than
DB-backed, because they matter most to readers who never sign in.

**Read them through `createLocalStore` + `useSyncExternalStore`, never a
`useState` + `useEffect` pair.** The eslint config has
`react-hooks/set-state-in-effect` as an *error*, so the "hydrate from storage in
an effect" pattern will not lint. `getSnapshot` must return a cached reference
until the value actually changes, and the server snapshot must be a shared
constant, or React loops on "getSnapshot should be cached".

## Spec values are free text

`Product.specs` is hand-entered JSON and almost nothing in it is clean. The
helpers that exist because of it:

- `isSpecEmpty` / `groupHasValues` (`formatSpecValue.ts`) — an untouched field
  arrives as `" "`, not `""`.
- `normalizeSpecToken` (`productFilters.ts`) — "12" and "12GB" are the same facet
  option; without it the dropdown lists both.
- `computeSpecFacets` returns `needsCategory: true` when the rows in scope span
  categories, since `FILTERABLE_SPECS` labels repeat across them (`chipset` and
  `processorModel` both render as "Processor").

The lesson these encode: **don't compute editorial claims from this data.** It is
inconsistent enough that any sentence derived from it is a guess wearing the
publication's voice. Filters and facets are fine; opinions are not.

## Before deploying

- **Point `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` at the real domain** (see the
  note under Environment above).
- `trustHost: true` in `src/auth/index.ts` is required for self-hosted
  production — without it every `/api/auth/session` request 500s with
  `UntrustedHost` under `next start`. It never reproduces under `next dev`. Safe
  only while the callback origin stays pinned by `NEXTAUTH_URL`.
- The service worker (`public/sw.js`) only registers in production;
  `ServiceWorkerRegistrar` unregisters stale ones under `next dev`, where a
  worker intercepts Turbopack's HMR and RSC requests. Bump `CACHE_VERSION` in
  `sw.js` to evict caches on the next activation.
- There is **no in-page install prompt** — deliberately removed. The manifest and
  worker stay, so the browser's own affordance still offers installation; don't
  re-add a `beforeinstallprompt` banner without asking.
- `tools/make-icons.js` regenerates `public/icons/*` (committed). Font-free by
  design: the rasteriser has no guaranteed font stack, and a missing face renders
  as blank space rather than failing.
