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

## Notes for contributors

[AGENTS.md](AGENTS.md) documents the non-obvious parts — where the Prisma client
is generated, how the two-theme compat layer works, which helpers not to
reimplement, and the API endpoints with destructive edge cases. Worth reading
before changing anything in `src/lib` or the theme system.
