import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();

  const totalPosts = await prisma.post.count();
  const publishedPosts = await prisma.post.count({ where: { published: true } });
  const draftPosts = await prisma.post.count({ where: { published: false } });
  const totalUsers = await prisma.user.count();

  const recentPosts = await prisma.post.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: { author: true },
  });

  // Data for charts
  const postsByMonth = await prisma.post.groupBy({
    by: ['createdAt'],
    _count: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  const monthlyData = postsByMonth.reduce((acc: any, item) => {
    const month = new Date(item.createdAt).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + item._count.id;
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Welcome back, {session?.user?.name} 👋
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">
          Here's what's happening with your blog
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm dark:shadow-none dark:border dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Posts</p>
          <p className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mt-2">{totalPosts}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm dark:shadow-none dark:border dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Published</p>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">{publishedPosts}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm dark:shadow-none dark:border dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Drafts</p>
          <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{draftPosts}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm dark:shadow-none dark:border dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Users</p>
          <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">{totalUsers}</p>
        </div>
      </div>

      <DashboardClient 
        initialRecentPosts={recentPosts}
        monthlyData={monthlyData}
        publishedPosts={publishedPosts}
        draftPosts={draftPosts}
      />
    </div>
  );
}