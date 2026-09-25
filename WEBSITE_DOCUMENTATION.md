# Blog Website — Complete Implementation Guide

This document explains how the website works from end to end: its architecture,
public features, dashboard tools, authentication, APIs, database, content
pipeline, SEO, PWA behavior, and operational requirements. It is written for
developers and administrators who need to understand, run, maintain, or extend
the application.

Implementation snapshot: **24 September 2026**.

## Contents

1. [System overview](#1-system-overview)
2. [Technology stack](#2-technology-stack)
3. [Application architecture](#3-application-architecture)
4. [Roles and authentication](#4-roles-and-authentication)
5. [Public route map](#5-public-route-map)
6. [Homepage](#6-homepage)
7. [Articles, categories, filtering, and search](#7-articles-categories-filtering-and-search)
8. [Article page and rich-content pipeline](#8-article-page-and-rich-content-pipeline)
9. [Reader engagement](#9-reader-engagement)
10. [Gadget catalogue](#10-gadget-catalogue)
11. [Product pages and ownership](#11-product-pages-and-ownership)
12. [Comparison system](#12-comparison-system)
13. [Newsletter](#13-newsletter)
14. [Advertising and promotions](#14-advertising-and-promotions)
15. [Themes and shared UI](#15-themes-and-shared-ui)
16. [Dashboard](#16-dashboard)
17. [API reference](#17-api-reference)
18. [Database model reference](#18-database-model-reference)
19. [Key implementation modules and functions](#19-key-implementation-modules-and-functions)
20. [SEO, feeds, and structured data](#20-seo-feeds-and-structured-data)
21. [PWA and offline behavior](#21-pwa-and-offline-behavior)
22. [Uploads and email delivery](#22-uploads-and-email-delivery)
23. [Local development](#23-local-development)
24. [Production and deployment](#24-production-and-deployment)
25. [Testing and auditing](#25-testing-and-auditing)
26. [Known limitations](#26-known-limitations)
27. [Common extension workflows](#27-common-extension-workflows)

## 1. System overview

The application combines two products in one site:

- A technology publication for news, reviews, guides, deals, and versus posts.
- A structured gadget catalogue for phones, laptops, smartwatches, and earbuds.

Readers can browse and search articles, rate and bookmark posts, participate in
polls, comment, subscribe to email updates, browse gadget specifications, record
product ownership, and compare up to three products from the same category.

Staff use the built-in dashboard to publish posts and products, curate
comparisons, moderate comments, manage subscribers, configure advertising,
manage users, and customize the site's visual theme.

The application uses Next.js Server Components for database-backed page
composition and Client Components for interactive state. PostgreSQL is the
source of truth for shared content. Personal state that should also work for
anonymous visitors—reading history and the comparison tray—is stored in the
browser.

## 2. Technology stack

| Area | Implementation |
| --- | --- |
| Framework | Next.js 16 App Router with Turbopack |
| UI runtime | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 plus theme tokens in `globals.css` |
| Database | PostgreSQL 17 |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Authentication | Auth.js v5 / `next-auth` |
| Sessions | Signed JWT sessions |
| Rich-text editor | TipTap 3 |
| Animation | Framer Motion / Motion |
| Email | Nodemailer through Gmail SMTP |
| Charts | Chart.js and `react-chartjs-2` |
| Icons | Lucide React and Bootstrap Icons |
| PWA | Web manifest plus a custom service worker |

The generated Prisma client is emitted to `generated/prisma`, not the default
`@prisma/client` location. Application code imports it through the `@/generated`
alias or a relative path.

## 3. Application architecture

```mermaid
flowchart TD
    Browser[Browser] --> Router[Next.js App Router]
    Router --> Pages[Server-rendered pages]
    Router --> API[Route-handler APIs]
    Pages --> Auth[Auth.js session]
    API --> Auth
    Pages --> Prisma[Prisma client]
    API --> Prisma
    Prisma --> PG[(PostgreSQL)]
    Pages --> Client[Interactive Client Components]
    Client --> API
    Client --> LS[(localStorage/sessionStorage)]
    API --> Files[public/uploads]
    API --> SMTP[Gmail SMTP]
    SW[Production service worker] --> Cache[(Static/page caches)]
```

### 3.1 Server-rendered pages

Pages under `src/app` read directly from Prisma where possible. This avoids an
extra HTTP request during server rendering. Examples include the homepage,
article listing, article detail, product listing, product detail, dashboard
overview, sitemap, and RSS feeds.

### 3.2 API route handlers

Route handlers under `src/app/api` serve interactive Client Components and
external callbacks. They validate inputs, repeat authorization checks, perform
database writes, and return JSON or redirects.

### 3.3 Client Components

Client Components implement live search, navigation menus, article engagement,
filters, comparison controls, dashboard forms, theme switching, and modal UI.
They call route handlers with `fetch` and update local state optimistically where
appropriate.

### 3.4 Database access

`src/lib/prisma.ts` creates a PostgreSQL pool with a maximum of ten connections,
keep-alive enabled, and idle-client error handling. In development the Prisma
client is cached on `globalThis` to prevent a new connection pool on every hot
reload. The module also detects when a cached client predates the latest
generated schema and replaces it.

### 3.5 Global providers

`src/app/providers.tsx` wraps the entire application with:

- `ThemeProvider` for light, dark, and system color modes.
- `SessionProvider` for client-side Auth.js session access.
- `CompareTrayProvider` for the persistent comparison tray.
- Navigation progress, page transitions, smooth anchors, and scroll restoration.
- Production service-worker registration.
- The global comparison tray UI.

## 4. Roles and authentication

### 4.1 Roles

| Role | Intended user | Main permissions |
| --- | --- | --- |
| `READER` | Public user signed in with Google or GitHub | Account editing, bookmarks, comments, ownership votes, authenticated poll/rating identity |
| `EDITOR` | Staff writer/editor | Dashboard access, own post management, products, comparisons, tags, comments, newsletter notifications, and selected promotional tools |
| `ADMIN` | Site administrator | All editor abilities plus users, UI settings, polls, banners, inline/hero/spotlight ads, and unrestricted post management |

### 4.2 Sign-in providers

Auth.js is configured in `src/auth/index.ts` with three providers:

1. **Credentials** — looks up the user by email, requires a stored password,
   compares it with bcrypt, and returns the database role.
2. **Google** — creates or updates a database user by email and defaults new
   accounts to `READER`.
3. **GitHub** — follows the same reader-upsert flow as Google.

OAuth accounts do not receive a password. Their name and image are refreshed on
subsequent OAuth sign-ins.

### 4.3 Session lifecycle

The application uses JWT sessions rather than the Prisma Auth.js adapter.
The JWT callback stores the database user ID, role, and image. The session
callback exposes those claims as `session.user.id`, `session.user.role`, and
`session.user.image`.

The self-service account page can update a user's name and image. It calls
Auth.js session update afterward so the navbar reflects the change without a
new login.

### 4.4 Route protection

`src/proxy.ts` reads the JWT at the edge:

- A signed-in user visiting `/login` is redirected to `/dashboard` when staff,
  otherwise to `/`.
- Anonymous users visiting `/dashboard/*` are redirected to `/login`.
- `READER` users are redirected away from the dashboard.
- `/dashboard/users` is reserved for `ADMIN`.

This proxy is only the first layer. Dashboard layouts and every mutating API
repeat authorization server-side, so security does not depend on the proxy
running correctly.

### 4.5 OAuth callback URLs

For a site whose `NEXTAUTH_URL` is `https://example.com`, register:

```text
https://example.com/api/auth/callback/google
https://example.com/api/auth/callback/github
```

For the current local server on port 3001, the callbacks are:

```text
http://localhost:3001/api/auth/callback/google
http://localhost:3001/api/auth/callback/github
```

## 5. Public route map

| Route | Purpose |
| --- | --- |
| `/` | Homepage containing editorial and gadget discovery sections |
| `/blog` | All published articles with filters, sort, and pagination |
| `/news` | Published `NEWS` posts |
| `/reviews` | Published `REVIEW` posts |
| `/versus` | Published `VERSUS` posts |
| `/deals` | Published `DEAL` posts |
| `/guides` | Published `GUIDE` posts |
| `/blog/[slug]` | Full article page |
| `/search?q=...` | Paginated full article search |
| `/products` | Product catalogue and filters |
| `/product/[slug]` | Product detail and specifications |
| `/tag/[slug]` | Tag-scoped product listing |
| `/compare` | Interactive gadget comparison |
| `/bookmarks` | Signed-in user's saved articles |
| `/account` | Signed-in user's account profile |
| `/login` | Credentials, Google, and GitHub sign-in |
| `/newsletter/confirmed` | Newsletter confirmation/unsubscribe result page |
| `/offline` | Static PWA fallback page |
| `/rss.xml` | Site-wide RSS feed |
| `/{category}/rss.xml` | Per-category RSS feed |
| `/sitemap.xml` | Database-driven sitemap |
| `/robots.txt` | Crawl rules |
| `/manifest.webmanifest` | PWA manifest |

There is currently no `/newsletter` landing page. Newsletter forms are embedded
on the site, and the confirmation result page exists, but the footer link to
`/newsletter` returns 404.

## 6. Homepage

`src/app/page.tsx` is a Server Component. It loads most homepage data in
parallel and revalidates at most every 60 seconds.

### 6.1 Data orchestration

The homepage loads:

- The newest published posts.
- Active hero banners.
- The newest products for each gadget category.
- Popular product tags.
- Active spotlight advertisements.
- Whether any poll is active and unexpired.
- The four most-viewed posts for Top Stories.
- Products with complete editorial verdicts.
- Active hero-rail advertisements.
- Database-backed visual settings.

Top Stories and Latest Posts are deduplicated. Top Stories claims the four most
viewed posts first; Latest Posts then takes the seven newest posts not already
shown. The Newsroom performs additional deduplication when the content corpus is
large enough.

### 6.2 Homepage section order

1. **Hero Banner** — active `Banner` rows displayed as an auto-playing carousel.
2. **Hero Ad Rail** — active `HeroAd` rows beside the banner on large screens.
3. **Top Stories** — four posts ranked by `Post.views`.
4. **Value Props** — static explanation of the site's value.
5. **Latest Posts** — newest non-duplicated articles.
6. **Social Links** — active `SocialLink` rows.
7. **Poll** — displayed only when an active, unexpired poll exists.
8. **Newsroom** — latest news river and scored review rail.
9. **Continue Reading** — private browser reading history; hidden for new users.
10. **Explore Gadgets** — category tabs and recent products.
11. **Spotlight Ad Rail** — media promotion beside gadget discovery.
12. **Editor's Verdicts** — products with both a score and written verdict.
13. **Latest Comparisons** — curated active comparison pairs.
14. **Footer Newsletter** — subscription form.

Sections that have no valid data return nothing rather than rendering empty
containers. The poll's presence also changes the responsive grid so an empty
sidebar track is not left behind.

### 6.3 Carousel behavior

Hero banners rotate every six seconds. Hero advertisements rotate every five
seconds. Both support manual navigation, pause on interaction, and avoid autoplay
when the browser requests reduced motion.

## 7. Articles, categories, filtering, and search

### 7.1 Categories versus tags

Each post has exactly one structural `PostCategory`:

- `NEWS`
- `REVIEW`
- `VERSUS`
- `DEAL`
- `GUIDE`

The canonical display registry is `src/lib/blog/categories.ts`. It maps enum
values to route slugs, labels, descriptions, and icons. Category slugs are root
routes, so new top-level routes must not collide with them.

Tags describe subjects such as a brand, platform, or device family. Posts and
products can both have many tags.

### 7.2 Shared article listing

`BlogListing` is shared by `/blog` and each category route. It supports:

- Text search across title, HTML content, author name, and tag name.
- Multiple tag filters using comma-separated slugs.
- Author filtering.
- Month and year filtering.
- Sorting by newest, oldest, or most read.
- Twelve posts per page.
- Category-aware tag and author choices.
- Stable pagination with view-count ties broken by newest date.

All filter state is encoded in URL query parameters. This makes filtered views
bookmarkable and shareable and keeps category routes stable—for example,
`/reviews?tag=samsung&sort=popular`.

### 7.3 Global search

There are two search experiences:

**Navbar live search** calls `GET /api/search` after a 300 ms debounce. It
requires at least two characters and returns separate article and product
groups. Article title matches are ranked first, followed by tag/author matches.
Body HTML is deliberately excluded from the small suggestion list to avoid
irrelevant matches from prose and embedded URLs.

**Full search page** at `/search?q=...` searches article titles, bodies, authors,
and tags. Results are newest-first, twelve per page. Search result pages are
marked `noindex,follow` and excluded from the sitemap.

## 8. Article page and rich-content pipeline

### 8.1 Article load

`/blog/[slug]` loads the post with author and tags, rejects missing or draft
posts with `notFound()`, loads the current bookmark state, resolves the
editorial category, and reads the optional editorial verdict.

It also loads active inline ads, banners, spotlight ads, and related articles
that share tags.

### 8.2 Content transformation order

Post bodies are stored as TipTap HTML. Before rendering, the server transforms
the HTML in this order:

1. Replace `[Ads N]` tokens with the active inline ad whose `position` is `N`.
2. Remove empty paragraphs left around replaced tokens.
3. Replace `[Banner N]` or `[Banners N]` with the active banner whose order is `N`.
4. Convert a `Key Highlights` heading followed by a list into a highlights card.
5. Convert adjacent `Pros` and `Cons` heading/list blocks into a combined card.
6. Convert `Also Read` heading/list blocks into related-link cards.
7. Convert the opening content into the drop-cap lead treatment when applicable.
8. Temporarily wrap HTML tables so other transformations cannot corrupt them.
9. Convert `Specifications` lists whose items use `Label: value` into spec cards.
10. Convert gallery markers into image galleries.
11. Remove trailing empty content.
12. Add lazy-loading and async decoding to article-body images.
13. Generate unique heading IDs and the table of contents.

Old body-level `<h1>` elements are demoted to `<h2>` so the article title remains
the page's only level-one heading. Duplicate heading text receives numbered IDs.

### 8.3 TipTap editor

The dashboard editor supports:

- Paragraphs and headings.
- Bold, italic, underline, strike-through, block quotes, and code.
- Ordered and unordered lists.
- Text alignment and font family.
- Links and unlinking.
- Resizable images.
- Image paste, file upload, and drag-and-drop insertion.
- Multi-image galleries.
- Privacy-enhanced YouTube embeds.
- Resizable tables.
- Undo and redo.
- Structured content-block insertion.

Structured content blocks are deliberately plain headings plus lists rather
than custom TipTap nodes. Their heading text and adjacency are parser contracts.
Changing `Key Highlights`, `Specifications`, `Pros`, `Cons`, or `Also Read`, or
inserting another node between the heading and list, prevents the published
article parser from recognizing the block.

### 8.4 Article presentation

The page renders:

- Category, tags, title, publication/update dates, author, and reading time.
- Responsive featured image and article image lightbox.
- Share controls and bookmark controls.
- Desktop table of contents generated from headings.
- Reading progress bar.
- Rich article HTML and enhanced tables.
- Spotlight advertising and social links in the side rail.
- Editorial verdict when valid.
- Reader rating widget.
- Threaded comments.
- Continue-reading and related-article sections.

### 8.5 Editorial verdicts versus reader ratings

These are separate systems:

- `Post.verdict*` is the editor's review opinion, scored out of ten. It is shown
  only when there is a usable score **and** a written summary.
- `Rating` rows are community scores submitted by readers.

`readVerdict()` is the canonical interpreter. It validates and clamps scores,
parses up to eight sub-scores, derives an overall score from sub-scores when
necessary, and withholds incomplete verdicts. Only the editorial verdict is
used for Review structured data.

## 9. Reader engagement

### 9.1 View counting

`ViewTracker` posts to `/api/posts/[id]/view`. The API increments `Post.views`,
sets a 12-hour HTTP-only cookie specific to the post, and skips repeat counts
while that cookie exists. It revalidates the homepage so Top Stories can reflect
new engagement. Failures are intentionally non-fatal.

### 9.2 Reading history

Reading history is private per-device state stored under
`reading-history-v1` in `localStorage`.

- At most 40 entries are kept.
- Progress only moves forward.
- Progress is periodically written while reading and flushed when the page is
  hidden or unmounted.
- Entries from 5% through less than 90% progress are considered resumable.
- The homepage Continue Reading rail prefers unfinished entries.
- The reader can clear the history.

The store uses `useSyncExternalStore` through `createLocalStore`, providing a
stable server snapshot, hydration safety, same-tab subscriptions, and cross-tab
updates through the browser `storage` event.

### 9.3 Bookmarks

Bookmarks require a signed-in user. The article button optimistically toggles
its state through `POST /api/bookmarks`. The API validates the post and either
creates or deletes the unique `(userId, postId)` row. `/bookmarks` retrieves the
current user's saved articles newest-first.

Guests who press the bookmark button are directed to login.

### 9.4 Reader ratings

Readers score an article from 1 through 10.

- Signed-in ratings are unique by `(postId, userId)`.
- Anonymous ratings are unique by `(postId, voterToken)`.
- Anonymous identity is stored in a one-year HTTP-only, same-site cookie.
- A later submission updates the existing rating.
- Every response returns the recalculated average, total count, and current
  reader's score.

### 9.5 Comments and replies

Public comment reads return only `APPROVED` rows. The API turns the flat database
result into a nested reply tree.

Posting requires login. Content must be non-empty and no longer than 2,000
characters. Replies are validated to ensure the parent belongs to the same post.

The author or staff can delete a comment. Replies cascade-delete with their
parent. A reader can report another user's comment; one report immediately
moves it to `PENDING`, hiding it until staff approve or reject it.

### 9.6 Polls

The homepage loads enabled polls whose end date is absent or still in the
future. A visitor can vote once per poll:

- Signed-in votes are unique by user and poll.
- Anonymous votes are unique by a one-year HTTP-only voter-token cookie.
- Closed, expired, and duplicate votes are rejected.
- After voting, the UI displays counts and percentages and locks the options.

### 9.7 Account profile

`/account` lets a signed-in user view their role, join date, bookmark count, and
comment count and update their name and image. The endpoint never accepts a user
ID; it always scopes reads and writes to the session user.

## 10. Gadget catalogue

### 10.1 Categories and spec schemas

Gadget definitions live in code under `src/lib/gadgets/categories`:

- Smartphones (`mobiles`)
- Laptops (`laptops`)
- Smartwatches (`smartwatch`)
- Earbuds (`earbuds`)

Each `GadgetCategoryDef` supplies a slug, name, icon, ordered specification
groups, fields, and an optional maximum comparison count. Field definitions
contain keys, labels, types, optional units/options, and whether a higher value
is better.

The database stores the category row and product's `specs` as JSON. The code
registry defines how that JSON is edited and displayed.

### 10.2 Product listing

`ProductListing` is shared by `/products` and `/tag/[slug]`. It supports:

- Search by product name or brand.
- Category selection.
- Brand selection.
- Minimum and maximum starting price.
- Sorting by newest, price ascending, price descending, or name.
- Category-specific specification facets.
- Tag scope.
- Quick filter pills.

The filters are represented in the URL. Database-friendly filters run in
Prisma. Specification filters run in application code because a free-text field
such as `8/12` RAM must match both `8GB` and `12GB` choices.

### 10.3 Specification normalization

`productFilters.ts` normalizes common size units so values such as `12`, `12GB`,
and `12gb` behave consistently. Multi-value cells are split on `/`, `,`, or `|`.
Numeric sizes are sorted by magnitude, including MB/GB/TB conversion.

Spec facets are withheld when the current result set spans multiple categories.
This prevents duplicated labels such as Processor, RAM, and Storage whose JSON
keys differ between phones and laptops. The sidebar asks the reader to select a
category first.

### 10.4 Product cards

Product cards show the primary image, name, brand, starting price when present,
tags, and a comparison control. Products without `priceFrom` show a generic
price action instead of inventing a price.

## 11. Product pages and ownership

### 11.1 Product detail

`/product/[slug]` loads only a valid product and its category definition. It
renders:

- Primary image, gallery, and color variants.
- Name, brand, price, category, and tags.
- Category-specific quick specifications.
- Comparison-tray toggle.
- Ownership widget.
- Editorial product verdict when complete.
- Sticky specification navigation.
- Grouped specification tables.

The quick-spec fields vary by category. The full table is driven entirely by
the ordered groups in the code registry and hides empty values.

### 11.2 Color variants and galleries

`Product.images` stores additional gallery URLs. `Product.colors` stores JSON
objects such as `{ name, hex, image }`. Selecting or hovering a color can preview
its image without changing the primary database image.

### 11.3 Ownership

Signed-in readers can choose:

- I want it (`WANT`)
- I have it (`HAVE`)
- I had it (`HAD`)

One ownership row exists per user/product. Selecting the current status again
clears it; selecting another status upserts it. The endpoint returns refreshed
aggregate counts for the three choices.

### 11.4 Product editorial verdict

Products use the same `readVerdict()` rules as posts. Valid product verdicts
feed the product detail page, Product JSON-LD, and homepage Editor's Verdicts
scoreboard. Specifications are never converted into an editorial opinion.

## 12. Comparison system

### 12.1 Global comparison tray

The tray is stored in `localStorage` under `compare-tray-v1` and is available on
every page.

- Maximum of three selected products.
- All products must belong to the same category.
- Duplicate products cannot be added.
- Two or more products produce a shareable `/compare` URL.
- The tray survives navigation, reloads, and browser restarts.
- Cross-tab updates are synchronized.

The URL format is:

```text
/compare?category=mobiles&p1=phone-a&p2=phone-b&p3=phone-c
```

### 12.2 Comparison page

The server reads the category and up to eight `pN` parameters, loads the initial
products in requested order, and supplies the matching category definition.
The client then manages interactive changes.

The comparison UI provides:

- Category selection.
- Searchable product slots.
- Duplicate-selection prevention.
- URL updates through `history.replaceState`.
- A sticky product/controls header.
- Specification-name search.
- Highlight-differences toggle.
- Differences-only filtering.
- Jump navigation between spec groups.
- A focused single-spec comparison bar.
- Separate desktop and mobile tables.
- Empty-row removal.

At least two products are required before the table is shown.

### 12.3 Curated comparisons

Staff can create a `Comparison` between two products in the same category,
activate/deactivate it, reorder it, and write a short verdict for either side.
Active curated pairs appear in homepage comparison cards.

The compare page shows editorial summary text only for the exact curated pair.
Arbitrary pairs and three-way comparisons generally have no summary, and the
summary component intentionally renders nothing rather than generating an
editorial opinion from inconsistent free-text specifications.

## 13. Newsletter

### 13.1 Double opt-in flow

```mermaid
sequenceDiagram
    participant Reader
    participant Site
    participant DB as PostgreSQL
    participant Mail as Gmail SMTP
    Reader->>Site: Submit email
    Site->>DB: Normalize and create/reuse pending subscriber
    Site->>Mail: Send confirmation link with token
    Reader->>Site: Open /api/newsletter/confirm?token=...
    Site->>DB: Set confirmed and confirmedAt
    Site->>Mail: Send welcome email
    Site-->>Reader: Redirect to confirmation result page
```

The subscription API validates and lowercases the email. Existing confirmed
addresses receive an "already subscribed" response. Existing unconfirmed rows
are reused so confirmation can be resent without changing the token.

Delivery success is not exposed in the public response, preventing the endpoint
from becoming an address-enumeration tool.

### 13.2 Unsubscribe

Every newsletter email contains a tokenized unsubscribe URL. Unsubscribe clears
`confirmed` and `confirmedAt` instead of deleting the row. This makes repeated
clicks and mail-client prefetching idempotent and allows later resubscription.

### 13.3 New-post notifications

Staff can notify confirmed subscribers from the posts dashboard. The API derives
a plain-text excerpt from the post HTML and `notifySubscribersOfNewPost()` sends
personalized messages in small concurrency batches. The returned count includes
successful deliveries.

## 14. Advertising and promotions

The site separates promotion types because each has a different placement and
data contract.

| Model | Placement | Behavior |
| --- | --- | --- |
| `Banner` | Homepage hero and `[Banner N]` article shortcodes | Image, copy, CTA, active state, and order |
| `Ad` | `[Ads N]` inside article bodies | Position-numbered inline image link |
| `HeroAd` | Portrait rail beside the homepage hero | Ordered auto-rotating image ads |
| `PopupAd` | Timed/scroll-triggered modal | Optional schedule, image, description, CTA, and frequency suppression |
| `SpotlightAd` | Homepage gadget rail and article side rail | Image, GIF, or video with adaptive rotation |
| `SocialLink` | Social sidebars | Platform, SVG icon, action text, color, order, and active state |

### 14.1 Popup frequency controls

Popup campaigns use browser storage to avoid repeatedly interrupting a visitor:

- `sessionStorage` records that a popup was shown during the session.
- `localStorage` records per-campaign dismissal and conversion suppression.
- Only currently active and scheduled campaigns are eligible.
- The popup waits for its dwell/scroll trigger before opening.

### 14.2 Sponsored-link behavior

Injected article ads and spotlight ads open external destinations with
appropriate sponsored/no-opener relationship attributes.

## 15. Themes and shared UI

The site has two design systems:

- `brutalist`
- `modern`

The selected site theme is stored in `SiteSetting` and rendered on
`<html data-theme="...">`. Independent light/dark preference is handled by
`next-themes` through a CSS class.

### 15.1 Database-backed appearance settings

Administrators can configure:

- Active site theme.
- Three accent colors for each theme.
- Custom or automatically derived modern dark accents.
- Dark background, card, border, and text surfaces per theme.
- Heading typography by semantic role.
- Homepage animated background.
- Spotlight-ad heading and title.

`getThemeSettings()` reads all required keys in one query. The root layout
generates scoped CSS variables for both site themes and injects them into the
initial HTML, preventing a flash of default colors.

### 15.2 Semantic typography

Shared heading roles such as `.h-display`, `.h-section`, `.h-eyebrow`, and
`.h-card` allow the dashboard typography settings to affect the entire site.
`SectionHeader` is the standard homepage section-heading component.

### 15.3 Navigation

The desktop and mobile navigation provide:

- News, Reviews, Blog, Gadgets, and Compare routes.
- Dashboard only for staff sessions.
- Global live search.
- Explore menu for article tags, gadget categories, and product tags.
- Light/dark toggle.
- Login for guests.
- Profile, bookmarks, and sign-out for signed-in users.

## 16. Dashboard

Dashboard routes render inside `DashboardShell` and require `ADMIN` or `EDITOR`.
The user and appearance sections have additional server-side `ADMIN` guards.

### 16.1 Route map

| Route | Feature | Typical access |
| --- | --- | --- |
| `/dashboard` | Analytics overview | Admin, Editor |
| `/dashboard/posts` | Post list and actions | Admin, Editor |
| `/dashboard/posts/new` | Create post | Admin, Editor |
| `/dashboard/posts/[id]/edit` | Edit post | Author or Admin |
| `/dashboard/gadgets` | Product catalogue management | Admin, Editor |
| `/dashboard/gadgets/new` | Create product | Admin, Editor |
| `/dashboard/gadgets/[id]` | Product details | Admin, Editor |
| `/dashboard/gadgets/[id]/edit` | Edit product | Admin, Editor |
| `/dashboard/gadgets/comparisons` | Curated comparisons | Admin, Editor |
| `/dashboard/comments` | Comment moderation | Admin, Editor |
| `/dashboard/newsletter` | Subscriber management | Staff UI |
| `/dashboard/ads` | Inline, hero, popup, spotlight ads | Mixed by API role |
| `/dashboard/banners` | Hero/article banners | Admin |
| `/dashboard/polls` | Poll management | Admin |
| `/dashboard/socials` | Social links | Admin, Editor |
| `/dashboard/users` | User accounts and roles | Admin only |
| `/dashboard/ui` | Theme and appearance settings | Admin only |

### 16.2 Analytics overview

The dashboard aggregates total/published posts, users, views, comments,
subscribers, products, comparisons, polls, ratings, and advertisement counts.
It also loads recent post data and renders charts/stat cards.

### 16.3 Post workflow

Admins see all posts; editors see only posts they authored. Staff can search and
filter the dashboard list.

A create/edit payload contains:

- Title and unique slug.
- HTML content.
- Featured image.
- Structural article category.
- Ordered tag IDs.
- Draft/published state.
- Editorial score, summary, and sub-scores.

Editors may update or delete only their own posts. Admins can update or delete
any post. The edit page also exposes the subscriber-notification action.

### 16.4 Product workflow

The product form supports:

- Slug, name, brand, category, published state.
- Primary image and gallery uploads.
- Color variants with name, hex value, and optional image.
- Starting price and currency.
- Tags.
- Category-specific specification fields.
- Editorial verdict and sub-scores.

When a product is created, the category database row is upserted from the code
registry. Duplicate slugs return a conflict. Deleting a product referenced by a
curated comparison is rejected until the comparison is removed.

### 16.5 Comparison workflow

Staff choose two different products from the same category, create the pair,
write optional per-product summaries, enable/disable it, and reorder homepage
display. The API validates that both products exist and share a category.

### 16.6 Comment moderation

The dashboard loads a flat cross-post queue of up to 500 comments. Staff can
filter `PENDING`, `APPROVED`, and `REJECTED` comments, change status, or
permanently delete a comment and its replies.

### 16.7 User management

Admins can list, create, edit, and delete users, set roles, update avatars,
change credentials, and hash new passwords with bcrypt. Passwords are never
returned by the list endpoint. An admin cannot delete their own current account.

### 16.8 Poll management

Admins can create questions and ordered options, set end dates, toggle active
state, edit, and delete polls. Sending `options` during a poll update replaces
all option rows and therefore deletes their votes by cascade. The dashboard's
active toggle sends only `{ isActive }` to preserve votes.

### 16.9 Appearance management

The UI settings form fetches the current database settings, previews changes,
and saves partial updates. Theme/background toggles are optimistic; palette,
surface, and typography changes are validated by the server before persistence.

## 17. API reference

Authentication labels below mean:

- **Public** — no session required.
- **Signed in** — any authenticated role.
- **Staff** — `ADMIN` or `EDITOR`.
- **Admin** — `ADMIN` only.
- **Owner/Admin** — post author or `ADMIN`.

### 17.1 Authentication and account

| Method | Endpoint | Access | Behavior |
| --- | --- | --- | --- |
| GET/POST | `/api/auth/[...nextauth]` | Public | Auth.js provider, callback, session, CSRF, and sign-out handlers |
| GET | `/api/account` | Signed in | Current profile and bookmark/comment counts |
| PATCH | `/api/account` | Signed in | Update current user's name and image |

### 17.2 Posts and engagement

| Method | Endpoint | Access | Behavior |
| --- | --- | --- | --- |
| GET | `/api/posts` | Signed in | Admin sees all; every other role is scoped to its own authored posts; supports filters |
| POST | `/api/posts` | Staff | Create draft/published post, tags, category, verdict |
| GET | `/api/posts/[id]` | Public | Retrieve one post for editing/view integrations |
| PATCH | `/api/posts/[id]` | Owner/Admin | Update post and relationships |
| DELETE | `/api/posts/[id]` | Owner/Admin | Delete post |
| POST | `/api/posts/[id]/view` | Public | Count one view per 12-hour post cookie |
| GET | `/api/posts/[id]/rating` | Public | Aggregate and current visitor rating |
| POST | `/api/posts/[id]/rating` | Public | Upsert 1–10 rating by user or anonymous token |
| GET | `/api/bookmarks` | Signed in | Current user's bookmarks |
| POST | `/api/bookmarks` | Signed in | Toggle bookmark for `postId` |
| GET | `/api/comments?postId=...` | Public | Approved threaded comments |
| POST | `/api/comments` | Signed in | Create comment or reply |
| POST | `/api/comments/[id]` | Signed in | Report another user's comment |
| PATCH | `/api/comments/[id]` | Staff | Change moderation status |
| DELETE | `/api/comments/[id]` | Owner/Staff | Delete comment and replies |
| GET | `/api/comments/moderation` | Staff | Flat moderation queue |
| GET | `/api/search?q=...` | Public | Navbar post/product suggestions |

### 17.3 Products and comparisons

| Method | Endpoint | Access | Behavior |
| --- | --- | --- | --- |
| GET | `/api/gadgets/categories` | Public | Code-defined gadget categories |
| GET | `/api/gadgets/products` | Public/Staff | Public sees published; staff can see drafts |
| POST | `/api/gadgets/products` | Staff | Create product and category row |
| GET | `/api/gadgets/products/[id]` | Public | Retrieve product |
| PATCH | `/api/gadgets/products/[id]` | Staff | Update product, tags, specs, colors, verdict |
| DELETE | `/api/gadgets/products/[id]` | Staff | Delete product unless comparison references it |
| POST | `/api/gadgets/products/[id]/ownership` | Signed in | Toggle/upsert ownership status and return counts |
| GET | `/api/gadgets/compare` | Public | Load selected products and exact-pair summaries |
| POST | `/api/gadgets/compare` | Staff | Create a curated pair after category validation |
| GET | `/api/gadgets/comparisons` | Public | List curated comparisons |
| POST | `/api/gadgets/comparisons` | Staff | Create curated comparison |
| PATCH | `/api/gadgets/comparisons/[id]` | Staff | Update active state/order/verdicts |
| DELETE | `/api/gadgets/comparisons/[id]` | Staff | Delete comparison |
| POST | `/api/gadgets/comparisons/reorder` | Staff | Persist display order |

### 17.4 Polls

| Method | Endpoint | Access | Behavior |
| --- | --- | --- | --- |
| GET | `/api/polls/active` | Public | Active unexpired polls plus totals/current vote |
| POST | `/api/polls/[id]/vote` | Public | Submit one vote by user/cookie identity |
| GET | `/api/polls` | Public | Polls and aggregate counts for management UI |
| POST | `/api/polls` | Admin | Create poll and options |
| PATCH | `/api/polls/[id]` | Admin | Update poll; option replacement removes votes |
| DELETE | `/api/polls/[id]` | Admin | Delete poll, options, and votes |

### 17.5 Newsletter

| Method | Endpoint | Access | Behavior |
| --- | --- | --- | --- |
| POST | `/api/newsletter` | Public | Validate email and send confirmation |
| GET | `/api/newsletter` | Signed in | List subscribers for dashboard |
| GET | `/api/newsletter/confirm?token=...` | Public | Confirm subscription and redirect |
| GET | `/api/newsletter/unsubscribe?token=...` | Public | Idempotently unsubscribe and redirect |
| POST | `/api/newsletter/notify` | Staff | Email confirmed subscribers about a post |
| DELETE | `/api/newsletter/[id]` | Signed in | Remove subscriber |

The list/delete endpoints currently check only for a session, not specifically a
staff role. The dashboard itself remains staff-only, but these APIs should be
tightened if direct endpoint access is part of the threat model.

### 17.6 Tags, users, uploads, and settings

| Method | Endpoint | Access | Behavior |
| --- | --- | --- | --- |
| GET | `/api/tags` | Public | List/search tags |
| POST | `/api/tags` | Staff | Create tag and visual configuration |
| PATCH | `/api/tags/[id]` | Staff | Update tag |
| DELETE | `/api/tags/[id]` | Staff | Delete tag |
| GET | `/api/users` | Admin | List users without passwords |
| POST | `/api/users` | Admin | Create user and hash password |
| PATCH | `/api/users/[id]` | Admin | Update profile, role, or password |
| DELETE | `/api/users/[id]` | Admin | Delete user, except current self |
| POST | `/api/upload` | Signed in | Store validated image/video in `public/uploads` |
| GET | `/api/settings/ui` | Public | Read public appearance settings |
| PUT | `/api/settings/ui` | Admin | Validate and partially update settings |

`/api/upload` currently permits any authenticated role, including `READER`.
Files are restricted by MIME type and size, but production deployments should
consider whether upload should be staff-only.

### 17.7 Promotions

| Resource | Read access | Write access | Endpoints |
| --- | --- | --- | --- |
| Inline ads | Public active / Admin management | Admin | `/api/ads`, `/api/ads/[id]` |
| Banners | Public read | Admin | `/api/banners`, `/api/banners/[id]` |
| Hero ads | Public active / Admin management | Admin | `/api/hero-ads`, `/api/hero-ads/[id]` |
| Popup ads | Public active/scheduled | Staff | `/api/popup-ads`, `/api/popup-ads/[id]` |
| Spotlight ads | Public active / Admin management | Admin | `/api/spotlight-ads`, `/api/spotlight-ads/[id]` |
| Social links | Public read | Staff | `/api/socials`, `/api/socials/[id]` |

## 18. Database model reference

### 18.1 Publishing and accounts

| Model | Purpose and important rules |
| --- | --- |
| `User` | Identity, optional password, role, avatar, and relations to authored/reader activity |
| `Post` | Article HTML, slug, category, draft state, views, ordered tags, editorial verdict |
| `Tag` | Shared post/product topic with icon and color policy |
| `Bookmark` | Unique saved post per user |
| `Session` | Legacy/database-session-compatible table; active Auth.js strategy is JWT |
| `Comment` | Threaded comment with moderation status and cascade-deleting replies |
| `Rating` | Reader score unique by signed-in user or anonymous token |

Important post indexes cover views, dates, verdict scores, and
`(category, createdAt)`.

### 18.2 Engagement

| Model | Purpose and important rules |
| --- | --- |
| `Poll` | Question, active state, optional end time |
| `PollOption` | Ordered choice that cascade-deletes with a poll |
| `PollVote` | One vote per poll/user or poll/anonymous token |
| `NewsletterSubscriber` | Unique email, reusable confirmation token, confirmation state/date |
| `ProductOwnership` | One `WANT`, `HAVE`, or `HAD` state per user/product |

### 18.3 Gadgets

| Model | Purpose and important rules |
| --- | --- |
| `GadgetCategory` | Database mirror of a code-defined category |
| `Product` | Catalogue item, images, colors JSON, price, tags, specs JSON, verdict |
| `Comparison` | Curated same-category pair, display order, active state, optional summaries |

Product specifications are intentionally free-form JSON. Display/filter helpers
normalize values, but the application does not generate editorial claims from
them.

### 18.4 Promotions and configuration

| Model | Purpose |
| --- | --- |
| `Banner` | Homepage hero and article banner-shortcode content |
| `Ad` | Position-numbered inline article ads |
| `HeroAd` | Homepage hero-side rail ads |
| `PopupAd` | Scheduled interstitial campaigns |
| `SpotlightAd` | Image/GIF/video promotional rail |
| `SocialLink` | Configurable social/action links |
| `SiteSetting` | String key/value store for visual and homepage settings |

## 19. Key implementation modules and functions

| Module/function | Responsibility |
| --- | --- |
| `src/lib/prisma.ts` / `makePrismaClient()` | PostgreSQL pool and Prisma lifecycle |
| `src/auth/index.ts` / `auth`, `signIn`, `signOut` | Auth.js server helpers and provider configuration |
| `src/proxy.ts` | Edge JWT redirects and dashboard role gate |
| `src/lib/blog/categories.ts` | Canonical post-category registry and slug validation |
| `src/lib/postUtils.ts` / `getExcerpt()` | Convert HTML to clean, unfused plain-text excerpts |
| `src/lib/postUtils.ts` / `getReadingTime()` | Estimate reading time at about 200 words/minute |
| `src/lib/postUtils.ts` / `formatRelativeTime()` | Human-readable post timestamps |
| `src/lib/blogSort.ts` / `parseSort()` | Validate listing sort query values |
| `src/lib/verdict.ts` / `normalizeScore()` | Clamp and round editorial scores to 0–10 |
| `src/lib/verdict.ts` / `parseSubScores()` | Safely validate free-form verdict JSON |
| `src/lib/verdict.ts` / `readVerdict()` | Publish only complete editorial verdicts |
| `src/lib/verdict.ts` / `verdictFieldsFromBody()` | Safely convert dashboard payloads to Prisma fields |
| `src/lib/settings.ts` / `getThemeSettings()` | Load the root layout's appearance settings in one query |
| `src/lib/settings.ts` / `setSetting()` | Upsert one key/value setting |
| `src/lib/localStore.ts` / `createLocalStore()` | Hydration-safe, reference-cached, cross-tab browser store |
| `src/lib/readingHistory.ts` / `recordVisit()` | Add/update a local reading-history entry |
| `src/lib/readingHistory.ts` / `updateProgress()` | Persist forward-only reading progress |
| `src/lib/readingHistory.ts` / `resumable()` | Select started but unfinished articles |
| `src/lib/gadgets/categories/index.ts` | Gadget spec registry and ordered category list |
| `src/lib/gadgets/productFilters.ts` / `buildProductWhere()` | Build database-supported catalogue filters |
| `productMatchesSpecFilters()` | Apply token-aware JSON specification facets |
| `computeSpecFacets()` | Derive category-safe filter choices from product data |
| `normalizeSpecToken()` | Normalize numeric storage/RAM unit variations |
| `src/lib/gadgets/formatSpecValue.ts` | Empty-value checks and comparison/table formatting |
| `lookupEditorVerdicts()` | Match an exact two-product pair in either order |
| `src/lib/rss.ts` / `fetchFeedPosts()` | Load the latest 30 feed posts |
| `src/lib/rss.ts` / `buildRss()` | Escape and generate RSS 2.0 XML |
| `src/lib/email/send.ts` / `sendEmail()` | Pooled SMTP delivery with safe failure handling |
| `notifySubscribersOfNewPost()` | Batched confirmed-subscriber delivery |
| `src/lib/appUrl.ts` / `APP_URL` | Base URL for SEO, emails, and absolute media URLs |

## 20. SEO, feeds, and structured data

### 20.1 Global metadata

The root layout defines the title template, description, Open Graph site data,
Twitter card defaults, robots defaults, manifest, viewport colors, and
`metadataBase` using `NEXT_PUBLIC_APP_URL`.

Pages define their own canonical URLs. A root canonical is deliberately avoided
because it would make child pages inherit `/`.

### 20.2 Article SEO

Article metadata includes:

- Clean excerpt description.
- Canonical `/blog/[slug]` URL.
- Article Open Graph data.
- Publication/modification dates.
- Author and featured image when present.
- Twitter large-image card.

Every published article emits `BlogPosting` JSON-LD. A valid editorial verdict
also emits a separate top-level `Review` JSON-LD block with rating and review
body.

### 20.3 Product SEO

Product pages emit canonical, Open Graph, Twitter, and `Product` JSON-LD data.
An `Offer` is emitted only when a starting price exists. A nested editorial
review is emitted only when `readVerdict()` returns a complete verdict.

`JsonLd` safely escapes `<` in serialized JSON so content cannot close the
script element.

### 20.4 Sitemap and robots

The sitemap revalidates hourly and contains:

- Homepage, blog, category routes, products, and compare.
- Every published post.
- Every published product.
- Tags used by published posts.

`robots.txt` blocks dashboard, account, bookmarks, API, and search routes and
declares the sitemap and RSS feed.

### 20.5 RSS

The global and category feeds contain the newest 30 published articles with
author, editorial category, tags, excerpt, publication date, and optional image
enclosure. XML text and CDATA terminators are escaped safely. Responses use
shared-cache revalidation and stale-while-revalidate headers.

## 21. PWA and offline behavior

The web manifest defines standalone display, portrait orientation, install
icons, a maskable icon, and shortcuts for articles, compare, and bookmarks.

The service worker registers only in production. During development, the
registrar removes old workers so cached assets do not interfere with Turbopack
HMR or React Server Component requests.

Production cache policy:

- Hashed Next.js assets, icons, uploads, fonts, and images: cache-first.
- Page navigations: network-first, then cached page, then `/offline`.
- APIs and non-navigation dynamic requests: network-only.
- Old cache versions: deleted during activation.

Change `CACHE_VERSION` in `public/sw.js` when a deployment must evict all old
runtime caches.

## 22. Uploads and email delivery

### 22.1 Uploads

`POST /api/upload` accepts multipart field `file` and supports:

- JPEG, PNG, GIF, WebP up to 5 MB.
- MP4, WebM, Ogg video up to 20 MB.

Files are stored under `public/uploads` with a timestamp-prefixed name and
returned as `/uploads/...` URLs. This is local filesystem storage, so a
multi-instance or ephemeral hosting platform requires replacement with shared
object storage.

### 22.2 Email

Email uses a pooled Nodemailer transport configured by `GMAIL_USER`,
`GMAIL_PASSWORD`, and `EMAIL_FROM`. Gmail requires an app password, not the
normal account password.

In development, missing SMTP configuration produces a logged preview instead of
attempting delivery. In production, missing configuration is treated as a real
delivery failure. `sendEmail()` logs errors and returns a result rather than
throwing through unrelated user requests.

## 23. Local development

### 23.1 Prerequisites

- Node.js 20 or newer.
- PostgreSQL 17.
- A dedicated PostgreSQL role and primary/shadow databases.

Recommended database setup:

```powershell
psql -U postgres -c "CREATE ROLE blog_app LOGIN PASSWORD 'choose-a-password'"
psql -U postgres -c "CREATE DATABASE blog_app OWNER blog_app"
psql -U postgres -c "CREATE DATABASE blog_app_shadow OWNER blog_app"
```

### 23.2 Environment variables

```ini
DATABASE_URL=postgresql://blog_app:password@localhost:5432/blog_app
SHADOW_DATABASE_URL=postgresql://blog_app:password@localhost:5432/blog_app_shadow

AUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=

GMAIL_USER=
GMAIL_PASSWORD=
EMAIL_FROM=
```

If Next.js selects port 3001 because port 3000 is occupied, update
`NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, and both OAuth callback registrations to
use port 3001.

### 23.3 Install and run

```powershell
npm.cmd install
npx.cmd prisma generate
npx.cmd prisma migrate dev
npm.cmd run dev
```

The optional database helper is:

```powershell
npm.cmd run db
```

### 23.4 Validation commands

```powershell
npx.cmd tsc --noEmit
npx.cmd prisma validate
npm.cmd run lint -- src
npm.cmd run build
```

The production build performs TypeScript validation but does **not** run ESLint.
The build also prerenders database-backed routes, so PostgreSQL must be running
with valid credentials.

## 24. Production and deployment

Before deployment:

1. Set `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` to the real HTTPS origin.
2. Register the production Google and GitHub callback URLs.
3. Use a strong `AUTH_SECRET`.
4. Configure PostgreSQL and run migrations.
5. Configure SMTP or intentionally accept disabled newsletter delivery.
6. Ensure uploaded files persist or replace local storage with object storage.
7. Run TypeScript, Prisma validation, ESLint, and the production build.
8. Run the rendered-site audits against the production-mode server.
9. Confirm sitemap, robots, RSS, Open Graph, and JSON-LD use the real domain.
10. Bump the service-worker cache version when cached assets must be evicted.

`trustHost: true` is required by the current self-hosted Auth.js configuration.
It is safe only while the callback origin remains pinned by `NEXTAUTH_URL`.

## 25. Testing and auditing

There is currently no conventional automated unit/integration test script.
TypeScript, Prisma validation, linting, builds, and browser audits are the
available checks.

`tools/audit` contains Playwright scripts for:

- Page and console errors.
- Metadata and canonical coverage.
- Accessibility-name gaps.
- Image problems.
- Tap-target sizing.
- Horizontal overflow.
- Desktop/mobile screenshots.
- Homepage section spacing and column alignment.

Run the app first, install Playwright if necessary, and set `AUDIT_BASE_URL` when
the server is not on the default origin. Do not run `next build` while auditing
a live `next dev` server because both commands share `.next`.

Recommended future automated coverage:

- Role and ownership authorization for posts and dashboard APIs.
- OAuth callback user upsert.
- Bookmark, rating, comment, poll, and ownership rules.
- Product facet normalization and comparison URL behavior.
- Newsletter confirmation and unsubscribe idempotence.
- Article block parsing and verdict publication rules.

## 26. Known limitations

- `/newsletter` returns 404 even though the footer links to it.
- Several footer and social links are still `#` placeholders.
- The source currently has substantial ESLint debt.
- There is no automated test suite.
- Most products have no `priceFrom`, so price-based quick filters have little or
  no useful data.
- Some product specs contain placeholder/junk values; free-text normalization
  cannot infer the intended value.
- Some author display names are placeholders.
- Article-body images do not have an enforced author-entered alt-text workflow.
- There is no default Open Graph image for pages without their own image.
- Popup interstitials may be considered intrusive by search engines.
- Local uploads need persistent shared storage in horizontally scaled hosting.
- Newsletter list/delete APIs and the upload API have broader session-based
  authorization than their dashboard use suggests.
- A category-specific products query and comparison lookup should be reviewed if
  unpublished product slugs must never be observable outside staff tools.
- The schema contains a `Session` model although active Auth.js sessions use JWTs.

## 27. Common extension workflows

### 27.1 Add an article category

1. Add the enum value to `PostCategory` in `prisma/schema.prisma`.
2. Add the display entry to `src/lib/blog/categories.ts`.
3. Generate and migrate Prisma.
4. Confirm the slug does not collide with another root route.
5. Verify navbar/category tabs, dashboard select, sitemap, and RSS route.

Most category consumers read the registry automatically.

### 27.2 Add a gadget category

1. Create a category definition under `src/lib/gadgets/categories`.
2. Define ordered specification groups and fields.
3. Register it in `CATEGORY_REGISTRY`.
4. Add appropriate product filter facets if needed.
5. Verify the product form, listing, detail page, and comparison tables.

The product-create API automatically creates/updates the matching database
category row.

### 27.3 Add a new site setting

1. Define the key and default in `src/lib/settings.ts`.
2. Add it to the batched read used by the relevant page/layout.
3. Add server validation in `/api/settings/ui`.
4. Add the dashboard control.
5. Consume the value on the server when possible to avoid visual flashes.

### 27.4 Add an article content block

1. Define the authoring contract in the TipTap editor.
2. Add a server-side parser that recognizes the stored HTML safely.
3. Add the rendered component/mount implementation.
4. Insert the parser at the correct point in the article transform pipeline.
5. Test malformed, missing, duplicate, and adjacent blocks.
6. Preserve heading semantics and table-of-contents behavior.

### 27.5 Add an API mutation

1. Authenticate and authorize inside the handler even when the page is guarded.
2. Validate and normalize every request field.
3. Scope writes to the current user or role.
4. Return specific 400/401/403/404/409 responses.
5. Update or revalidate affected cached pages.
6. Add automated coverage for the permission boundary and destructive cases.

### 27.6 Change a poll without losing votes

Send only fields such as:

```json
{ "isActive": false }
```

Do not include `options` unless deliberately replacing every option and its
votes.

### 27.7 Publish a valid editorial verdict

Provide a written `verdictSummary` and either:

- A valid overall `verdictScore`, or
- Valid sub-scores from which the overall score can be derived.

A bare score is intentionally not displayed and does not produce Review
structured data.
