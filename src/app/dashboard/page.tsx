import Link from "next/link";
import {
  Plus,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  FileText,
  Eye,
  Mail,
  Users2,
  BellRing,
  BarChart3,
  Clock,
  LayoutGrid,
  Smartphone,
  Megaphone,
  Heart,
  Tag,
  ChevronRight,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/ui/StatCard";
import TopPostsPanel from "@/components/feeds/TopPostsPanel";
import TypewriterHeading from "@/components/dashboard/TypewriterHeading";
import PostsPerMonthChart from "@/components/dashboard/PostsPerMonthChart";
import { getPostCategory } from "@/lib/blog/categories";

const MONTHS_SHOWN = 6;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// Icon chip colours, spelled out in full so Tailwind can see the classes.
const CHIP = {
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  cyan: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
} as const;

function Panel({
  title,
  Icon,
  chip,
  action,
  children,
}: {
  title: string;
  Icon: typeof FileText;
  chip: keyof typeof CHIP;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${CHIP[chip]}`}>
            <Icon className="h-4 w-4" />
          </span>
          <h2
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h2>
        </div>
        {action && (
          <Link
            href={action.href}
            className="text-xs font-medium text-blue-500 transition-colors hover:text-blue-600"
          >
            {action.label} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** "Today", "Yesterday", "3d ago" for the past week, then a short date. */
function relativeDay(date: Date, now: Date) {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });
}

/** The last MONTHS_SHOWN calendar months, oldest first, zero-filled. */
function bucketByMonth(dates: Date[], now: Date) {
  const months = Array.from({ length: MONTHS_SHOWN }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS_SHOWN - 1 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("en", { month: "short" }), count: 0 };
  });
  const index = new Map(months.map((m, i) => [m.key, i]));
  for (const date of dates) {
    const i = index.get(`${date.getFullYear()}-${date.getMonth()}`);
    if (i !== undefined) months[i].count++;
  }
  return months.map(({ label, count }) => ({ label, count }));
}

export default async function DashboardPage() {
  const session = await auth();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const chartStart = new Date(now.getFullYear(), now.getMonth() - (MONTHS_SHOWN - 1), 1);

  const [
    publishedPosts,
    draftPosts,
    viewsAgg,
    confirmedSubscribers,
    totalUsers,
    newUsersThisWeek,
    pendingComments,
    topPosts,
    recentPosts,
    chartPosts,
    totalProducts,
    publishedProducts,
    activeComparisons,
    productOwnerships,
    activeBanners,
    activeAds,
    activeHeroAds,
    activePopups,
    activeSpotlights,
    totalComments,
    totalBookmarks,
    ratingAgg,
    activePolls,
    pollVotes,
    blogTags,
    productTags,
    activeSocials,
  ] = await Promise.all([
    prisma.post.count({ where: { published: true } }),
    prisma.post.count({ where: { published: false } }),
    prisma.post.aggregate({ _sum: { views: true } }),
    prisma.newsletterSubscriber.count({ where: { confirmed: true } }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.comment.count({ where: { status: "PENDING" } }),
    prisma.post.findMany({
      take: 5,
      orderBy: { views: "desc" },
      select: { id: true, title: true, slug: true, views: true, published: true },
    }),
    prisma.post.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        published: true,
        createdAt: true,
        featuredImage: true,
        category: true,
        author: { select: { name: true } },
      },
    }),
    prisma.post.findMany({
      where: { createdAt: { gte: chartStart } },
      select: { createdAt: true },
    }),
    prisma.product.count(),
    prisma.product.count({ where: { published: true } }),
    prisma.comparison.count({ where: { active: true } }),
    prisma.productOwnership.count(),
    prisma.banner.count({ where: { active: true } }),
    prisma.ad.count({ where: { active: true } }),
    prisma.heroAd.count({ where: { active: true } }),
    prisma.popupAd.count({ where: { isActive: true } }),
    prisma.spotlightAd.count({ where: { active: true } }),
    prisma.comment.count(),
    prisma.bookmark.count(),
    prisma.rating.aggregate({ _avg: { value: true }, _count: { id: true } }),
    prisma.poll.count({ where: { isActive: true } }),
    prisma.pollVote.count(),
    prisma.tag.count({ where: { posts: { some: {} } } }),
    prisma.tag.count({ where: { products: { some: {} } } }),
    prisma.socialLink.count({ where: { isActive: true } }),
  ]);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const totalViews = viewsAgg._sum.views ?? 0;
  const months = bucketByMonth(chartPosts.map((p) => p.createdAt), now);
  const ratingCount = ratingAgg._count.id;
  const avgRating = ratingAgg._avg.value;

  const attention = [
    pendingComments > 0 && {
      href: "/dashboard/comments",
      Icon: MessageSquare,
      text: `${plural(pendingComments, "comment")} awaiting approval`,
    },
    draftPosts > 0 && {
      href: "/dashboard/posts",
      Icon: FileText,
      text: `${plural(draftPosts, "draft")} not yet published`,
    },
  ].filter(Boolean) as { href: string; Icon: typeof FileText; text: string }[];

  // Everything the old stat-card grid showed, grouped by area as label →
  // number rows. Rows with a dashboard page link to it.
  const glance: {
    area: string;
    Icon: typeof FileText;
    chip: keyof typeof CHIP;
    note?: string;
    items: { label: string; value: number; hint?: string; href?: string }[];
  }[] = [
    {
      area: "Catalog",
      Icon: Smartphone,
      chip: "cyan",
      items: [
        { label: "Products", value: totalProducts, hint: `${publishedProducts} published`, href: "/dashboard/gadgets" },
        { label: "Comparisons", value: activeComparisons, href: "/dashboard/gadgets/comparisons" },
        { label: "Owned / wanted", value: productOwnerships },
      ],
    },
    {
      area: "Promotions",
      Icon: Megaphone,
      chip: "amber",
      note: "active",
      items: [
        { label: "Banners", value: activeBanners, href: "/dashboard/banners" },
        { label: "Inline ads", value: activeAds, href: "/dashboard/ads" },
        { label: "Hero rail ads", value: activeHeroAds, href: "/dashboard/ads" },
        { label: "Popups", value: activePopups, href: "/dashboard/ads" },
        { label: "Spotlights", value: activeSpotlights, href: "/dashboard/ads" },
      ],
    },
    {
      area: "Engagement",
      Icon: Heart,
      chip: "rose",
      items: [
        { label: "Comments", value: totalComments, href: "/dashboard/comments" },
        { label: "Bookmarks", value: totalBookmarks },
        {
          label: "Ratings",
          value: ratingCount,
          hint: ratingCount && avgRating !== null ? `avg ${avgRating.toFixed(1)}/10` : undefined,
        },
        { label: "Active polls", value: activePolls, hint: plural(pollVotes, "vote"), href: "/dashboard/polls" },
        { label: "New users this week", value: newUsersThisWeek, href: "/dashboard/users" },
      ],
    },
    {
      area: "Site",
      Icon: Tag,
      chip: "violet",
      items: [
        { label: "Article tags", value: blogTags },
        { label: "Product tags", value: productTags },
        { label: "Social links", value: activeSocials, href: "/dashboard/socials" },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <TypewriterHeading
            text={`Welcome back, ${firstName}`}
            className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50"
            style={{ fontFamily: "var(--font-display)" }}
          />
          <p className="mt-1.5 text-zinc-500 dark:text-zinc-400">
            Here&apos;s what&apos;s happening across the blog today.
          </p>
        </div>
        <Link
          href="/dashboard/posts/new"
          className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={18} />
          New post
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        <StatCard label="Published posts" value={publishedPosts} icon={<FileText className="h-4 w-4" />} accent="blue" index={0} />
        <StatCard label="Total views" value={totalViews} icon={<Eye className="h-4 w-4" />} accent="cyan" index={1} />
        <StatCard label="Subscribers" value={confirmedSubscribers} icon={<Mail className="h-4 w-4" />} accent="emerald" index={2} />
        <StatCard label="Total users" value={totalUsers} icon={<Users2 className="h-4 w-4" />} accent="violet" index={3} />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Panel title="Needs attention" Icon={BellRing} chip="amber">
          {attention.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              All clear. Nothing is waiting on you.
            </p>
          ) : (
            <ul className="space-y-1">
              {attention.map(({ href, Icon, text }) => (
                <li key={text}>
                  <Link
                    href={href}
                    className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-zinc-700 transition hover:bg-amber-50/60 dark:text-zinc-300 dark:hover:bg-amber-500/5"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-amber-500" />
                    <span className="flex-1">{text}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <TopPostsPanel posts={topPosts} />
      </div>

      <Panel title={`Posts per month · last ${MONTHS_SHOWN} months`} Icon={BarChart3} chip="blue">
        <PostsPerMonthChart months={months} />
      </Panel>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Panel title="Recent posts" Icon={Clock} chip="violet" action={{ href: "/dashboard/posts", label: "View all" }}>
          {recentPosts.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No posts yet.{" "}
              <Link href="/dashboard/posts/new" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Write the first one
              </Link>
            </p>
          ) : (
            <ul className="-mx-3 -my-1.5 space-y-0.5">
              {recentPosts.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/dashboard/posts/${post.id}/edit`}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  >
                    {post.featuredImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.featuredImage}
                        alt=""
                        loading="lazy"
                        className="h-10 w-14 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
                        <FileText className="h-4 w-4 text-blue-300 dark:text-blue-400/40" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-400">
                        {post.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="font-medium text-zinc-600 dark:text-zinc-300">
                          {getPostCategory(post.category).label}
                        </span>
                        {" · "}
                        {post.author?.name ?? "Unknown"} · {relativeDay(post.createdAt, now)}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                        post.published
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                      }`}
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                    <ChevronRight className="hidden h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-blue-500 sm:block dark:text-zinc-600" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Site at a glance" Icon={LayoutGrid} chip="cyan">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            {glance.map(({ area, Icon, chip, note, items }) => (
              <div key={area} className="min-w-0">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-md ${CHIP[chip]}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {area}
                  </h3>
                  {note && <span className="text-xs text-zinc-400 dark:text-zinc-500">{note}</span>}
                </div>
                <ul className="-mx-2">
                  {items.map(({ label, value, hint, href }) => {
                    const row = (
                      <>
                        <span className="min-w-0 truncate text-zinc-600 dark:text-zinc-400">
                          {label}
                          {hint && <span className="ml-1.5 text-xs text-zinc-400 dark:text-zinc-500">{hint}</span>}
                        </span>
                        <span
                          className={`shrink-0 font-semibold tabular-nums ${
                            value === 0 ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          {value.toLocaleString()}
                        </span>
                      </>
                    );
                    const rowClass = "flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm";
                    return (
                      <li key={label}>
                        {href ? (
                          <Link
                            href={href}
                            className={`${rowClass} transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40`}
                          >
                            {row}
                          </Link>
                        ) : (
                          <div className={rowClass}>{row}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
