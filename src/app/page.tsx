import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PopupAd from "@/components/PopupAd";
import BackToTop from "@/components/BackToTop";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/AnimatedSection";
import Carousel from "@/components/Carousel";
import Poll from "@/components/Poll";
import ScrollRevealText from "@/components/ScrollRevealText";
import SocialSidebar from "@/components/SocialSidebar"; // <-- Added import

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export default async function HomePage() {
  const session = await auth();

  const [recentPosts, banners] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { author: true },
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

      {/* Banner Carousel */}
      {banners.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 pt-10">
          <Carousel banners={banners} />
        </div>
      )}

      {/* <ScrollRevealText text="Every post starts as a thought worth keeping. We write the ones that stick, share the ones worth reading, and skip the rest." /> */}

      {/* Main Content - Socials left / Posts centered / Poll right */}
      <section className="max-w-[1600px] mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-12">

          {/* Left Sidebar - Social Sidebar */}
          <div className="hidden lg:block lg:w-72 flex-shrink-0 pt-4 lg:pt-0">
            <div className="sticky top-24">
              <SocialSidebar />
            </div>
          </div>

          {/* Center - Latest Posts */}
          <div className="flex-1 lg:max-w-[760px] mx-auto">
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
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recentPosts.map((post) => (
                  <StaggerItem key={post.id}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group bg-card rounded-2xl overflow-hidden hover:shadow-xl dark:hover:shadow-none transition-all duration-300 flex flex-col h-full block border border-border"
                    >
                      {/* Image */}
                      <div className="overflow-hidden">
                        {post.featuredImage ? (
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-52 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/30 flex items-center justify-center">
                            <span className="text-5xl">📝</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wide">
                            Blog
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 inline-block" />
                        </div>

                        <h4 className="text-base font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug mb-3 line-clamp-3">
                          {post.title}
                        </h4>

                        <div className="mt-auto flex items-center gap-1 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground/80">
                            {post.author.name}
                          </span>
                          <span className="mx-1">·</span>
                          <span>{formatDate(post.createdAt)}</span>
                        </div>
                      </div>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
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

          {/* Right Sidebar - Poll */}
          <div className="lg:w-80 flex-shrink-0 lg:ml-10 pt-4 lg:pt-0">
            <div className="sticky top-24">
              <Poll />
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <BackToTop />
    </div>
  );
}