import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PopupAd from "@/components/PopupAd";
import BackToTop from "@/components/BackToTop";
import { FadeIn } from "@/components/AnimatedSection";
import Carousel from "@/components/Carousel";
import Poll from "@/components/Poll";
import SocialSidebar from "@/components/SocialSidebar";
import TrendingNews from "@/components/TrendingNews";
import LatestNews from "@/components/LatestNews";
import MobileNewsHighlights from "@/components/MobileNewsHighlights";
import LatestPostsFeed from "@/components/LatestPostsFeed";
import LatestComparisons from "@/components/LatestComparisons";
import NewsletterForm from "@/components/NewsletterForm";


// Safety-net revalidation: even if revalidatePath("/") from the view
// route is ever missed (e.g. multi-instance deploys, edge caching),
// the homepage will never be more than 60s stale.
export const revalidate = 60;

export default async function HomePage() {
  const session = await auth();

  const [recentPosts, banners] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      // 7 posts: the bento feed below is hand-tessellated for exactly 7 tiles
      // (1 hero + 4 small + 2 wide). Changing this number will break the layout
      // unless LatestPostsFeed's BENTO_LAYOUT is updated to match.
      take: 7,
      orderBy: { createdAt: "desc" },
      include: { author: true, tags: true },
    }),
    prisma.banner.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PopupAd />

      {/* Banner Carousel + flanking Trending / Latest */}
      {banners.length > 0 && (
        <div className="max-w-[1600px] mx-auto px-6 pt-10">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left - Trending (desktop only) */}
            <div className="hidden lg:block lg:w-72 flex-shrink-0">
              <TrendingNews />
            </div>

            {/* Center - Carousel */}
            <div className="w-full flex-1 min-w-0">
              <Carousel banners={banners} />
            </div>

            {/* Right - Latest (desktop only) */}
            <div className="hidden lg:block lg:w-72 flex-shrink-0">
              <LatestNews />
            </div>
          </div>

          {/* Mobile-only: Trending/Latest tabs, right below carousel */}
          <div className="mt-6">
            <MobileNewsHighlights />
          </div>
        </div>
      )}

      {/*
        Main Content - Posts centered / Poll + Social right

        KEY FIX: this row is now a CSS Grid instead of a flexbox.
        Grid's default `align-items: stretch` reliably forces every
        column (both sidebars + the center "Latest Posts" column) to
        share the EXACT same height — the height of the tallest
        column (the posts feed). Each sidebar's sticky wrapper below
        (`h-full`) inherits that stretched height, so `position: sticky`
        is contained by its own column and naturally releases the
        instant the Latest Posts column ends. Nothing below this grid
        (Latest Comparisons, Footer, etc.) can be overlapped anymore,
        because the sticky element's containing block stops exactly
        at the bottom of this grid row.
      */}
      <section className="max-w-[1600px] mx-auto px-6 py-20">
        <div
          className="
            flex flex-col gap-10
            lg:grid lg:gap-12 lg:items-stretch
            lg:grid-cols-[18rem_minmax(0,1fr)_20rem]
          "
        >
          {/* Left Sidebar - Social Sidebar (desktop only) */}
          <div className="hidden lg:block h-full pt-4 lg:pt-0">
            <div className="sticky top-24 self-start">
              <SocialSidebar />
            </div>
          </div>

          {/* Center - Latest Posts (bento mosaic, both mobile and desktop) */}
          <div className="w-full lg:max-w-[900px] mx-auto">
            <FadeIn>
              <div className="mb-12 text-center lg:text-left">
                <h3 className="text-3xl font-bold text-foreground mb-2">Latest Posts</h3>
                <p className="text-muted-foreground">Check out recent articles</p>
              </div>
            </FadeIn>

            {recentPosts.length === 0 ? (
              <FadeIn>
                <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
                  <p className="text-lg">No posts published yet</p>
                </div>
              </FadeIn>
            ) : (
              <LatestPostsFeed posts={recentPosts} />
            )}

            {recentPosts.length > 0 && (
              <FadeIn delay={0.4}>
                <div className="text-center mt-12">
                  <Link href="/blog" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    View all posts →
                  </Link>
                </div>
              </FadeIn>
            )}
          </div>

          {/* Right Sidebar - Poll (+ Social Sidebar right below it, mobile only) */}
          <div className="h-full pt-4 lg:pt-0">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Poll />
              <div className="lg:hidden mt-8">
                <SocialSidebar />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*
        Latest Comparisons + Newsletter, side by side.

        items-stretch (not items-start) so the Newsletter column takes
        on the exact height of the taller Comparisons column. The card
        itself is h-full with an internal flex-1 spacer, so its form
        naturally settles at the bottom of the card — landing on the
        same baseline as each comparison card's "Compare now" row.
      */}
      <section className="max-w-[1600px] mx-auto px-6 pb-20 mt-6 lg:mt-10">
        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12 lg:items-stretch">
          <div className="min-w-0">
            <LatestComparisons />
          </div>

          <div className="flex justify-center lg:justify-start">
            <NewsletterForm />
          </div>
        </div>
      </section>

      <Footer />
      <BackToTop />
    </div>
  );
}