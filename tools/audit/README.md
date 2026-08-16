# Audit tooling

Browser-driven checks for the rendered site. These exist because a passing
build and a clean `tsc` say nothing about what a visitor actually sees — every
issue these caught (dead links, moving buttons, a 313px layout snap, an auth
500 that only appears in production) was invisible to both.

## Setup

Playwright is not a project dependency. Either install it:

```bash
npm i -D playwright && npx playwright install chromium
```

…or rely on the npx cache (`npx playwright --version` once). The scripts look in
both places.

## Running

Start a server first, and note **which** one — `next build` writes to the same
`.next` directory as a running `next dev`, so building mid-session disrupts it.

```bash
npm run dev            # or: npm run build && npm run start

node tools/audit/site-audit.js     # errors, metadata, a11y, lazy, overflow
node tools/audit/layout-audit.js   # section spacing + column alignment
```

Point them elsewhere with `AUDIT_BASE_URL=https://staging.example.com`.

Output (screenshots + `audit.json`) lands in `tools/audit/.out/`, which is
gitignored.

## Reading the output

**`failed=` against a production server is mostly noise.** Most entries will be
`net::ERR_ABORTED` on page routes — Next's `<Link>` prefetch being cancelled as
the script scrolls and closes pages. `site-audit.js` prints a separate count of
requests that returned an actual HTTP status ≥ 400; that is the number worth
reacting to. Dev does not prefetch the same way, so the count is far lower there.

**`small=`** counts interactive elements under 24×24 (WCAG 2.2 minimum target
size). Carousel dots and checkboxes are the usual offenders — keep the visible
dot small and pad the button around it rather than shrinking the hit area.

**layout-audit gaps**: a gap roughly double `main gap` means an element is a
flex child of `<main>` and collecting the section gap on both sides.

**layout-audit grid edges**: sidebar rails in different sections should share a
left edge. A mismatch means one section declared a different column width.

## hide-test-data.js

Hides placeholder content (an unpublished junk product, deactivated test polls)
without deleting anything — it only flips `published` / `isActive`, and prints
the SQL to undo it. Edit the two lists at the top to target new placeholders.

```bash
node tools/audit/hide-test-data.js --dry   # preview
node tools/audit/hide-test-data.js         # apply
```
