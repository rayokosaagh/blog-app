import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { Newspaper, Sparkles, Smartphone } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PopupAd from "@/components/ads/PopupAd";
import BackToTop from "@/components/ui/BackToTop";
import { FadeIn } from "@/components/ui/AnimatedSection";
import HeroBanner from "@/components/home/HeroBanner";
import AdCarousel from "@/components/ads/AdCarousel";
import ValueProps from "@/components/home/ValueProps";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import Poll from "@/components/polls/Poll";
import SocialSidebar from "@/components/layout/SocialSidebar";
import TopStoriesMosaic from "@/components/feeds/TopStoriesMosaic";
import { readVerdict } from "@/lib/verdict";
import LatestPostsFeed from "@/components/feeds/LatestPostsFeed";
import ContinueReading from "@/components/feeds/ContinueReading";
import Newsroom, { getNewsroom } from "@/components/feeds/Newsroom";
import LatestComparisons from "@/components/gadgets/LatestComparisons";
import NewsletterForm from "@/components/newsletter/NewsletterForm";
import SectionDivider from "@/components/ui/SectionDivider";
import { CATEGORY_LIST } from "@/lib/gadgets/categories";
import ProductsByCategoryTabs from "@/components/gadgets/ProductsByCategoryTabs";
import FeaturedSwapCard from "@/components/gadgets/FeaturedSwapCard";
import VerdictScoreboard, { getScoredProducts } from "@/components/gadgets/VerdictScoreboard";
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

export default async function HomePage() {
  const session = await auth();
  const [animatedBackground, spotlightHeader, spotlightTitle] = await Promise.all([
    getHomepageAnimatedBackground(),
    getSpotlightAdsHeader(),
    getSpotlightAdsTitle(),
  ]);

const [recentPostsPool, banners, productsByCategoryArrays, topTags, spotlightAds, activePollCount, topStories, scoredProducts, ads] = await Promise.all([
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
    select: {
      id: true,
      slug: true,
      title: true,
      featuredImage: true,
      createdAt: true,
      views: true,
      category: true,
      verdictScore: true,
      verdictSummary: true,
      verdictSubScores: true,
    },
  }),
  // Editor's verdicts scoreboard — products with a written, scored verdict.
  // Empty until an editor scores a product, and the section hides itself.
  getScoredProducts(),
  // Ad rail beside the hero — every active HeroAd (Dashboard → Ads → Hero
  // rail ads), in position order. Not `Ad`: those are the in-article
  // shortcode banners.
  prisma.heroAd.findMany({
    where: { active: true },
    orderBy: { position: "asc" },
    select: { id: true, title: true, image: true, link: true },
  }),
]);

const hasActivePoll = activePollCount > 0;

// The two feeds must not show the same article twice. Top stories takes
// priority (it is higher on the page and its selection is the deliberate one),
// so anything it claims is dropped from Latest Posts, which then falls back to
// the next-newest post. This is why the query above fetches 11 instead of 7.
const topStoryIds = new Set(topStories.map((p) => p.id));
const recentPosts = recentPostsPool.filter((p) => !topStoryIds.has(p.id)).slice(0, 7);

// Newsroom (news river + reviews rail) runs after the mosaic and knows what
// it showed, so it can avoid repeating it when the corpus is big enough —
// see the dedupe note in Newsroom.tsx.
const newsroom = await getNewsroom({
  topStoryIds: [...topStoryIds],
  mosaicIds: recentPosts.map((p) => p.id),
});

const productsByCategory = Object.fromEntries(
  CATEGORY_LIST.map((c, i) => [c.slug, productsByCategoryArrays[i]])
);

// Top stories carry their verdict score into the mosaic — through readVerdict,
// so a bare number with no written bottom line publishes nothing (AGENTS.md).
const mosaicStories = topStories.map((p) => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  featuredImage: p.featuredImage,
  createdAt: p.createdAt,
  category: p.category,
  score: readVerdict(p)?.score ?? null,
}));

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
          Above the fold: banner hero (copy over artwork) with the
          auto-cycling ad rail beside it, then Top Stories as
          a ranked mosaic, then the value-props band. The hero and the mosaic
          each hide themselves when they have nothing to show; the ad rail
          collapses and the hero takes the full width when no ad is active.
        */}
        {(banners.length > 0 || mosaicStories.length > 0) && (
          <section className="max-w-[1600px] mx-auto px-6 w-full">
            {banners.length > 0 && (
              <FadeIn>
                <div
                  className={`grid gap-4 lg:items-stretch ${
                    ads.length > 0 ? "lg:grid-cols-[minmax(0,1fr)_20rem]" : ""
                  }`}
                >
                  <HeroBanner banners={banners} />
                  {ads.length > 0 && <AdCarousel ads={ads} interval={5000} />}
                </div>
              </FadeIn>
            )}

            {mosaicStories.length > 0 && (
              <>
                <div className="mt-8 sm:mt-10">
                  <SectionHeader
                    Icon={Newspaper}
                    eyebrow="Most read"
                    title="Top Stories"
                    subtitle="The most-read articles right now"
                    action={{ href: "/blog", label: "All stories" }}
                  />
                </div>
                <TopStoriesMosaic stories={mosaicStories} />
              </>
            )}

            <FadeIn>
              <div className="mt-6">
                <ValueProps />
              </div>
            </FadeIn>
          </section>
        )}

        {/*
          Main Content - Posts centered / Poll + Social right

        */}
        {banners.length > 0}


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
                <SectionHeader
                  Icon={Sparkles}
                  eyebrow="Fresh off the press"
                  title="Latest Posts"
                  subtitle="The newest articles across every category"
                  action={{ href: "/blog", label: "View all posts" }}
                  accent="accent-2"
                />
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


        {/*
          Newsroom — Verge-style split: timestamped news river left, reviews
          rail with scores right. Placed after the mosaic so it is not
          shoulder-to-shoulder with the feed that shows the newest posts of
          every kind; together with the resume rail below it, it closes the
          editorial half of the page before the gadget sections start. Hides
          itself (divider too) until there are at least two news posts and
          one review.
        */}
        {newsroom.news.length >= 2 && newsroom.reviews.length > 0 && <SectionDivider />}
        <Newsroom data={newsroom} />

        {/* Returning readers only — renders nothing until there's local
            history, so a first visit sees the same page as before.

            Sits at the end of the editorial run, after the Newsroom: this is
            the one homepage section whose content the reader has already
            seen, so it should not come before any of the new material. Every
            fresh feed — the mosaic, the news river, the reviews rail — gets
            its turn first, then the resume rail catches them on the way down
            into the gadget sections. */}
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
        <SectionHeader
          Icon={Smartphone}
          eyebrow="Explore by category / brand"
          title="Explore Gadgets"
          subtitle="Browse the latest phones, laptops, earbuds and smartwatches"
          action={{ href: "/products", label: "All gadgets" }}
        />
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

        {/*
          Editor's verdicts — scored gadgets with their bottom line. Sits with
          the other two gadget sections (browse the catalogue -> what we scored
          -> head-to-head) rather than between Top Stories and Latest Posts,
          where it split the editorial run in half and put the page's tallest
          cards directly under its shortest ones. Renders nothing (and neither
          does its divider) until a product has been scored in the dashboard.
        */}
        {scoredProducts.length > 0 && <SectionDivider />}
        <VerdictScoreboard products={scoredProducts} />

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