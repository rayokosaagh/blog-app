// app/dashboard/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SidebarNav from "@/components/SideBarNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/login");

  const isAdmin = session.user?.role === "ADMIN";

  return (
    <div className="h-screen flex bg-zinc-50 dark:bg-black text-zinc-950 dark:text-zinc-50 antialiased overflow-hidden">
      {/* Sidebar Wrapper */}
      <aside className="w-64 bg-white dark:bg-zinc-900 flex flex-col border-r border-zinc-200/80 dark:border-zinc-800 sticky top-0 h-screen">
        {/* Profile / Header */}
        <div className="p-6 flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Blog Dashboard</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{session.user?.email}</p>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              {session.user?.role}
            </span>
          </div>
        </div>

        {/* Dynamic Navigation Component */}
        <SidebarNav isAdmin={isAdmin} />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto bg-zinc-50/50 dark:bg-black/40">
        {children}
      </main>
    </div>
  );
}