import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/dashboard/DashboardClient";
import StatCard from "@/components/ui/StatCard";
import AnalyticsCharts from "@/components/dashboard/AnalyticsCharts";
import TopPostsPanel from "@/components/feeds/TopPostsPanel";
import ContentExtrasPanel from "@/components/dashboard/ContentExtrasPanel";
import TypewriterHeading from "@/components/dashboard/TypewriterHeading";
import {
  FileText,
  CheckCircle2,
  Users2,
  Eye,
  MessageSquare,
  Bookmark,
  Mail,
  UserPlus,
  Smartphone,
  GitCompareArrows,
  BarChart3,
  Vote,
  Image as ImageIcon,
  Megaphone,
  Sparkles,
  Heart,
} from "lucide-react";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
      {children}
    </p>
  );
}

function toMonthlyMap(rows: { createdAt: Date; _count: { id: number } }[]) {
  return rows.reduce((acc: Record<string, number>, item) => {
    const month = new Date(item.createdAt).toLocaleString("default", { month: "short" });
    acc[month] = (acc[month] || 0) + item._count.id;
    return acc;
  }, {});
}

export default async function DashboardPage() {
  const session = await auth();

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const [
    totalPosts,
    publishedPosts,
    totalUsers,
    viewsAgg,
    totalComments,
    totalBookmarks,
    confirmedSubscribers,
    newUsersThisWeek,
    recentPosts,
    postsByMonth,
    topPosts,
    ratingAgg,
    activeSocials,
    usersByMonth,
    ratingGroups,
    subscribersByMonth,
    totalProducts,
    publishedProducts,
    activeComparisons,
    totalPolls,
    activePolls,
    pollVotes,
    productOwnerships,
    totalRatings,
    blogTags,
    productTags,
    activeBanners,
    activeAds,
    activePopups,
    activeSpotlights,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.user.count(),
    prisma.post.aggregate({ _sum: { views: true } }),
    prisma.comment.count(),
    prisma.bookmark.count(),
    prisma.newsletterSubscriber.count({ where: { confirmed: true } }),
    prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.post.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { author: true },
    }),
    prisma.post.groupBy({
      by: ["createdAt"],
      _count: { id: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.post.findMany({
      take: 5,
      orderBy: { views: "desc" },
      select: { id: true, title: true, slug: true, views: true, published: true },
    }),
    prisma.rating.aggregate({ _avg: { value: true } }),
    prisma.socialLink.count({ where: { isActive: true } }),
    prisma.user.groupBy({
      by: ["createdAt"],
      _count: { id: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.rating.groupBy({
      by: ["value"],
      _count: { id: true },
    }),
    prisma.newsletterSubscriber.groupBy({
      by: ["createdAt"],
      _count: { id: true },
      where: { confirmed: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.product.count(),
    prisma.product.count({ where: { published: true } }),
    prisma.comparison.count({ where: { active: true } }),
    prisma.poll.count(),
    prisma.poll.count({ where: { isActive: true } }),
    prisma.pollVote.count(),
    prisma.productOwnership.count(),
    prisma.rating.count(),
    prisma.tag.count({ where: { posts: { some: {} } } }),
    prisma.tag.count({ where: { products: { some: {} } } }),
    prisma.banner.count({ where: { active: true } }),
    prisma.ad.count({ where: { active: true } }),
    prisma.popupAd.count({ where: { isActive: true } }),
    prisma.spotlightAd.count({ where: { active: true } }),
  ]);

  const totalViews = viewsAgg._sum.views ?? 0;
  const avgRating = ratingAgg._avg.value ?? 0;

  const monthlyPostData = toMonthlyMap(postsByMonth);
  const monthlyUserData = toMonthlyMap(usersByMonth);
  const monthlySubscriberData = toMonthlyMap(subscribersByMonth);

  const ratingDistribution = ratingGroups.reduce((acc: Record<number, number>, item) => {
    acc[item.value] = item._count.id;
    return acc;
  }, {});

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      <div>
        <TypewriterHeading
          text={`Welcome back, ${firstName}`}
          className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50"
          style={{ fontFamily: "var(--font-display)" }}
        />
        <p className="text-zinc-500 dark:text-zinc-400 mt-1.5">
          Here's what's happening across the blog today.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          label="Total posts"
          value={totalPosts}
          icon={<FileText className="h-4 w-4" />}
          accent="blue"
          index={0}
        />
        <StatCard
          label="Published"
          value={publishedPosts}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="emerald"
          index={1}
        />
        <StatCard
          label="Products"
          value={totalProducts}
          icon={<Smartphone className="h-4 w-4" />}
          accent="cyan"
          index={2}
        />
        <StatCard
          label="Total users"
          value={totalUsers}
          icon={<Users2 className="h-4 w-4" />}
          accent="violet"
          index={3}
        />
      </div>

      <div>
        <SectionLabel>Engagement &amp; growth</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            label="Total views"
            value={totalViews}
            icon={<Eye className="h-4 w-4" />}
            accent="cyan"
            index={4}
            size="compact"
          />
          <StatCard
            label="Comments"
            value={totalComments}
            icon={<MessageSquare className="h-4 w-4" />}
            accent="rose"
            index={5}
            size="compact"
          />
          <StatCard
            label="Bookmarks"
            value={totalBookmarks}
            icon={<Bookmark className="h-4 w-4" />}
            accent="amber"
            index={6}
            size="compact"
          />
          <StatCard
            label="Subscribers"
            value={confirmedSubscribers}
            icon={<Mail className="h-4 w-4" />}
            accent="emerald"
            index={7}
            size="compact"
          />
          <StatCard
            label="New users (7d)"
            value={newUsersThisWeek}
            icon={<UserPlus className="h-4 w-4" />}
            accent="violet"
            index={8}
            size="compact"
          />
        </div>
      </div>

      <div>
        <SectionLabel>Catalog &amp; gadgets</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            label="Published products"
            value={publishedProducts}
            icon={<CheckCircle2 className="h-4 w-4" />}
            accent="emerald"
            index={9}
            size="compact"
          />
          <StatCard
            label="Comparisons"
            value={activeComparisons}
            icon={<GitCompareArrows className="h-4 w-4" />}
            accent="blue"
            index={10}
            size="compact"
          />
          <StatCard
            label="Owned / wanted"
            value={productOwnerships}
            icon={<Heart className="h-4 w-4" />}
            accent="rose"
            index={11}
            size="compact"
          />
          <StatCard
            label="Poll votes"
            value={pollVotes}
            icon={<Vote className="h-4 w-4" />}
            accent="amber"
            index={12}
            size="compact"
          />
          <StatCard
            label="Active polls"
            value={activePolls}
            icon={<BarChart3 className="h-4 w-4" />}
            accent="violet"
            index={13}
            size="compact"
          />
        </div>
      </div>

      <div>
        <SectionLabel>Site &amp; promotions</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            label="Active banners"
            value={activeBanners}
            icon={<ImageIcon className="h-4 w-4" />}
            accent="blue"
            index={14}
            size="compact"
          />
          <StatCard
            label="Inline ads"
            value={activeAds}
            icon={<Megaphone className="h-4 w-4" />}
            accent="amber"
            index={15}
            size="compact"
          />
          <StatCard
            label="Popup ads"
            value={activePopups}
            icon={<Megaphone className="h-4 w-4" />}
            accent="rose"
            index={16}
            size="compact"
          />
          <StatCard
            label="Spotlights"
            value={activeSpotlights}
            icon={<Sparkles className="h-4 w-4" />}
            accent="cyan"
            index={17}
            size="compact"
          />
          <StatCard
            label="Total polls"
            value={totalPolls}
            icon={<BarChart3 className="h-4 w-4" />}
            accent="violet"
            index={18}
            size="compact"
          />
        </div>
      </div>

      <AnalyticsCharts
        monthlyPostData={monthlyPostData}
        publishedPosts={publishedPosts}
        monthlyUserData={monthlyUserData}
        ratingDistribution={ratingDistribution}
        monthlySubscriberData={monthlySubscriberData}
      />

      <TopPostsPanel posts={topPosts} />

      <ContentExtrasPanel
        avgRating={avgRating}
        totalRatings={totalRatings}
        blogTags={blogTags}
        productTags={productTags}
        activeSocials={activeSocials}
      />
    </div>
  );
}