import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { ArrowRight, Sparkles, Newspaper } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PopupAd from "@/components/ads/PopupAd";
import BackToTop from "@/components/ui/BackToTop";
import { FadeIn } from "@/components/ui/AnimatedSection";
import HeroSpotlight from "@/components/ui/HeroSpotlight";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import Poll from "@/components/polls/Poll";
import SocialSidebar from "@/components/layout/SocialSidebar";
import TopStoryTiles from "@/components/feeds/TopStoryTiles";
import LatestPostsFeed from "@/components/feeds/LatestPostsFeed";
import ContinueReading from "@/components/feeds/ContinueReading";
import LatestComparisons from "@/components/gadgets/LatestComparisons";
import NewsletterForm from "@/components/newsletter/NewsletterForm";
import SectionDivider from "@/components/ui/SectionDivider";
import { CATEGORY_LIST } from "@/lib/gadgets/categories";
import ProductsByCategoryTabs from "@/components/gadgets/ProductsByCategoryTabs";
import FeaturedSwapCard from "@/components/gadgets/FeaturedSwapCard";
import SpotlightAdRail from "@/components/ads/SpotlightAdRail";
import {
  getHomepageAnimatedBackground,
  getSpotlightAdsHeader,
  getSpotlightAdsTitle,
} from "@/lib/settings";

// Title/description come from the root layout's defaults — the homepage is the
// one page those defaults were written for, so only the canonical is set here.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

// Safety-net revalidation: even if revalidatePath("/") from the view
// route is ever missed (e.g. multi-instance deploys, edge caching),
// the homepage will never be more than 60s stale.
export const revalidate = 60;

// Single source of truth for the vertical rhythm between the major
// homepage sections. Applied ONCE as a `gap` on the wrapping <main>
// rather than as py on each individual section — stacking top+bottom
// padding from adjacent sections was doubling the visual gap.
const SECTION_GAP = "gap-10 sm:gap-14 lg:gap-16";
// Deliberately tighter than SECTION_GAP: this is the space under the navbar,
// and the first section (the hero) adds its own pt-6 under the divider rule on
// top of it. Matching the between-sections rhythm here stacked to ~88px and
// pushed the hero well below the fold on laptops.
const SECTION_TOP_PADDING = "pt-4 sm:pt-6 lg:pt-8";
const SECTION_BOTTOM_PADDING = "pb-10 sm:pb-14 lg:pb-16";

// Category chips shown under the hero — mirrors the gadget categories
// already modeled in src/lib/gadgets/categories. Kept as a small static
// list here rather than importing the category config, since only the
// slug + label are needed for a homepage nav chip.
const HERO_CATEGORIES = [
  { label: "Laptops", href: "/compare?category=laptops" },
  { label: "Mobiles", href: "/compare?category=mobiles" },
  { label: "Earbuds", href: "/compare?category=earbuds" },
  { label: "Smartwatches", href: "/compare?category=smartwatches" },
];

export default async function HomePage() {
  const session = await auth();
  const [animatedBackground, spotlightHeader, spotlightTitle] = await Promise.all([
    getHomepageAnimatedBackground(),
    getSpotlightAdsHeader(),
    getSpotlightAdsTitle(),
  ]);

const [recentPostsPool, banners, productsByCategoryArrays, topTags, spotlightAds, activePollCount, topStories] = await Promise.all([
  // Over-fetched (11, not 7) because the most-read posts are filtered out of
  // this list below — see the dedupe under this Promise.all.
  prisma.post.findMany({
    where: { published: true },
    take: 11,
    orderBy: { createdAt: "desc" },
    include: { author: true, tags: true },
  }),
  prisma.banner.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  }),
  Promise.all(
    CATEGORY_LIST.map((c) =>
      prisma.product.findMany({
        where: { published: true, category: { slug: c.slug } },
        orderBy: { createdAt: "desc" },
        take: 7,
        select: {
          id: true,
          slug: true,
          name: true,
          brand: true,
          image: true,
          priceFrom: true,
          currency: true,
        },
      })
    )
  ),
  prisma.tag.findMany({
  where: { products: { some: { published: true } } },
  select: {
    id: true,
    name: true,
    slug: true,
    icon: true,
    colorMode: true,
    color: true,
    _count: { select: { products: true } },
  },
  orderBy: { products: { _count: "desc" } },
  take: 10,
}),
  (prisma as any).spotlightAd.findMany({
    where: { active: true },
    orderBy: { position: "asc" },
    select: { id: true, title: true, mediaUrl: true, mediaType: true, link: true },
  }),
  // Mirrors the condition in /api/polls/active, which is what <Poll /> fetches.
  // Used only to decide whether the poll column gets laid out at all.
  prisma.poll.count({
    where: {
      isActive: true,
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    },
  }),
  // Top stories = the four most-read posts. Ranked purely by views so the strip
  // answers "what are people actually reading", which is a different question
  // from the Latest Posts feed below it.
  prisma.post.findMany({
    where: { published: true },
    orderBy: { views: "desc" },
    take: 4,
    select: { id: true, slug: true, title: true, featuredImage: true, createdAt: true, views: true },
  }),
]);

const hasActivePoll = activePollCount > 0;

// The two feeds must not show the same article twice. Top stories takes
// priority (it is higher on the page and its selection is the deliberate one),
// so anything it claims is dropped from Latest Posts, which then falls back to
// the next-newest post. This is why the query above fetches 11 instead of 7.
const topStoryIds = new Set(topStories.map((p) => p.id));
const recentPosts = recentPostsPool.filter((p) => !topStoryIds.has(p.id)).slice(0, 7);

const productsByCategory = Object.fromEntries(
  CATEGORY_LIST.map((c, i) => [c.slug, productsByCategoryArrays[i]])
);

  return (
    <div className="relative min-h-screen">
      {/* Login-style animated backdrop, behind all content (subtle).
          Toggled from the dashboard → UI settings. */}
      {animatedBackground && (
        <AnimatedBackground className="fixed inset-0 -z-10 opacity-40" />
      )}
      <Navbar />
      <PopupAd />

      <main className={`flex flex-col ${SECTION_GAP} ${SECTION_TOP_PADDING} ${SECTION_BOTTOM_PADDING}`}>
        {/* The homepage had no h1 at all — its first heading was an h2 inside
            the promo carousel, so screen readers and crawlers got no statement
            of what this page is. Visually hidden because the hero carousel is
            the intended visual opener; the design is unchanged. */}
        <h1 className="sr-only">
          Blog — tech news, gadget reviews and spec comparisons
        </h1>
        {/*
          CNET-style hero: a large featured carousel image joined to a
          title/description card that changes in lockstep with the banner,
          followed by a row of four secondary story tiles (2 trending + 2 new).
        */}
        {banners.length > 0 && (
          <section className="max-w-[1600px] mx-auto px-6 w-full">
            <div className="pt-6 border-t border-border-heavy">
              <FadeIn>
                <HeroSpotlight banners={banners} />
              </FadeIn>

              {/* Secondary stories header — icon chip + title/subtitle on the
                  left, "All stories" pill on the right, over a divider rule.
                  Uses themeable surfaces so it reads bold/blocky in brutalist
                  and clean/rounded in modern. */}
              {/* Tighter above sm — see the line-clamp note in HeroSpotlight;
                  these margins are the other 20px keeping the top stories off
                  a small phone's first screen. */}
              <div className="mt-6 mb-4 sm:mt-10 sm:mb-5 flex items-end justify-between gap-4 border-b-2 border-border-heavy pb-3">
                <div className="flex items-center gap-3">
                  {/* Icon colour comes from --on-accent-3, not a pinned white.
                      Pinning white assumed accent-3 is always dark enough to
                      carry it, which holds for both brutalist schemes and
                      modern light — but modern dark derives accent-3 as a pale
                      lilac (#bfa5fa), where white drops to 2.1:1 and the mark
                      all but disappears. The token already solves this: it
                      resolves to white on dark fills and to dark ink on light
                      ones, so the chip reads as a solid colour block with a
                      legible mark in every theme, which was the intent. */}
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center surface-border border-border-heavy bg-accent-3 text-on-accent-3 shadow-brutal-sm">
                    <Newspaper className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    {/* h2, not h3: this is a top-level section of the page and
                        sat below the article cards' own h3s, which scrambled
                        the outline. Renamed too — "More top stories" was the
                        FIRST content section, so "more" referred to nothing. */}
                    <h2 className="text-lg font-extrabold uppercase tracking-tight leading-none text-foreground">
                      Top stories
                    </h2>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      The most-read articles right now
                    </p>
                  </div>
                </div>
                <Link
                  href="/blog"
                  className="group inline-flex shrink-0 items-center gap-1.5 surface-pill border-border-heavy bg-card px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-foreground shadow-brutal-sm brutal-press hover:bg-accent-3 hover:text-on-accent-3"
                >
                  All stories
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
              <TopStoryTiles posts={topStories} />
            </div>
          </section>
        )}

        {/*
          Main Content - Posts centered / Poll + Social right

        */}
        {banners.length > 0 && <SectionDivider />}


        <section className="max-w-[1600px] mx-auto px-6 w-full">
          {/* Two layouts, driven by whether a poll will actually render.
              With a poll it's the original three columns: socials | feed | poll.
              Without one, <Poll /> returns null but its 20rem track did not,
              leaving a dead column; worse, the surviving two-column form put a
              263px socials card in the LEAD position with ~750px of empty rail
              under it, before the reader reached any article. So the no-poll
              layout flips to feed-first with socials trailing — which is also
              what every other section on this page does (Explore Gadgets and
              Comparisons both run content left, sidebar right). */}
          <div
            className={`
              flex flex-col gap-10
              lg:grid lg:gap-12 lg:items-stretch
              ${
                hasActivePoll
                  ? "lg:grid-cols-[18rem_minmax(0,1fr)_20rem]"
                  : // 20rem, not 18rem: every other right-hand rail on this
                    // page is 20rem (the poll column, and Featured Products in
                    // Explore Gadgets). At 18rem this one started 32px further
                    // right than the others, so the rail visibly jogged
                    // sideways as you scrolled past it.
                    "lg:grid-cols-[minmax(0,1fr)_20rem]"
              }
            `}
          >
            {/* Social Sidebar (desktop only). Ordered after the feed when it is
                the only sidebar, so the articles lead. */}
            <div
              className={`hidden lg:block h-full pt-4 lg:pt-0 ${
                hasActivePoll ? "" : "lg:order-2"
              }`}
            >
              <div className="sticky top-24 self-start">
                <SocialSidebar />
              </div>
            </div>

            {/* Latest Posts (bento mosaic, both mobile and desktop).
                The 900px cap belongs to the three-column layout, where the feed
                is the middle track. In the no-poll layout it is the wide track,
                and capping it there would just re-introduce the empty space as
                margins either side — so it fills its column instead. */}
            <div
              className={`w-full mx-auto ${
                hasActivePoll ? "lg:max-w-[900px]" : "lg:order-1"
              }`}
            >
              <FadeIn>
                <div className="mb-10 text-center lg:text-left pb-4 border-b-4 border-border-heavy">
                  <div className="inline-flex items-center gap-2 mb-3 justify-center lg:justify-start w-full lg:w-auto bg-accent-2 text-on-accent-2 border-2 border-border-heavy px-3 py-1 w-fit">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-extrabold tracking-[0.14em] uppercase">
                      Fresh off the press
                    </span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2 tracking-tight">
                    Latest Posts
                  </h3>
                  <p className="text-muted-foreground">
                    Check out recent articles
                  </p>
                </div>
              </FadeIn>

              {recentPosts.length === 0 ? (
                <FadeIn>
                  <div className="bg-card border-2 border-border-heavy rounded-none p-12 text-center text-muted-foreground shadow-brutal">
                    <p className="text-lg">No posts published yet</p>
                  </div>
                </FadeIn>
              ) : (
                <LatestPostsFeed posts={recentPosts} />
              )}

              {recentPosts.length > 0 && (
                <FadeIn delay={0.4}>
                  <div className="flex justify-center lg:justify-start mt-12">
                    <Link
                      href="/blog"
                      className="
                        cta-primary
                        group inline-flex items-center gap-2 px-5 py-2.5
                        rounded-none border-2 border-border-heavy bg-accent-3
                        text-xs font-extrabold uppercase tracking-wide text-on-accent-3
                        shadow-brutal-sm brutal-press
                      "
                    >
                      View all posts
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </FadeIn>
              )}
            </div>

            {/* Right Sidebar - Poll (+ Social Sidebar stacked below it, mobile only).
                On mobile this block still has to render even with no poll,
                because it carries the Socials card; on desktop it collapses
                away entirely so the grid above can drop to two columns. */}
            <div className={`h-full pt-4 lg:pt-0 ${hasActivePoll ? "" : "lg:hidden"}`}>
              <div className="lg:sticky lg:top-24 lg:self-start">
                <div className="flex flex-col gap-6 lg:block">
                  <Poll />
                  <div className="lg:hidden">
                    <SocialSidebar />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Returning readers only — renders nothing until there's local
            history, so a first visit sees the same page as before.

            Sits AFTER the Latest Posts feed, not above it: this rail is the
            one homepage section whose content the reader has already seen, so
            leading with it pushed the newest articles — the reason the page
            exists — below a list of things they'd half-finished. Editorial
            leads; the resume rail catches them on the way down. */}
        <ContinueReading />

        {/*
          Latest Comparisons + Newsletter, side by side.

          items-stretch (not items-start) so the Newsletter column takes
          on the exact height of the taller Comparisons column. The card
          itself is h-full with an internal flex-1 spacer, so its form
          naturally settles at the bottom of the card — landing on the
          same baseline as each comparison card's "Compare now" row.
        */}
        <SectionDivider />
<section className="max-w-[1600px] mx-auto px-6 w-full">
  <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12 lg:items-stretch">
    <div className="min-w-0">
      <FadeIn>
        <div className="mb-8 text-center lg:text-left pb-4 border-b-4 border-border-heavy">
          <div className="inline-flex items-center gap-2 mb-3 justify-center lg:justify-start w-full lg:w-auto bg-accent text-on-accent border-2 border-border-heavy px-3 py-1 w-fit">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-extrabold tracking-[0.14em] uppercase">
              Explore by category/brand
            </span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2 tracking-tight">
            Explore Gadgets
          </h3>
          <p className="text-muted-foreground">
            Browse the latest phones, laptops, earbuds and smartwatches
          </p>
        </div>
      </FadeIn>

      <ProductsByCategoryTabs
        categories={CATEGORY_LIST}
        productsByCategory={productsByCategory}
        tags={topTags}
      />

      {/* Spotlight ad — mobile/tablet only (desktop shows it in the right rail) */}
      {spotlightAds.length > 0 && (
        <div className="lg:hidden mt-8 h-[360px]">
          <SpotlightAdRail
            ads={spotlightAds}
            header={spotlightHeader}
            title={spotlightTitle}
          />
        </div>
      )}
    </div>

    {/* Right rail — auto-rotating sponsored ad, fills the vacant space and
        matches the category component's height. Desktop only. */}
    <div className="hidden lg:flex">
      {spotlightAds.length > 0 && (
        <SpotlightAdRail
          ads={spotlightAds}
          header={spotlightHeader}
          title={spotlightTitle}
        />
      )}
    </div>
  </div>
</section>

        {/* Comparisons run full width now. There used to be a NewsletterForm in
            a right-hand column here, which put two different signup forms on
            screen at once next to the footer's — same ask, two designs, and
            only the footer's collects the terms consent. One form, in the
            footer, is the honest version. */}
        <section className="max-w-[1600px] mx-auto px-6 w-full">
          <div className="min-w-0">
            <LatestComparisons />
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}