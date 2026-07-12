// app/dashboard/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import SidebarNav from "@/components/SideBarNav";
import DashboardTopbar from "@/components/DashboardTopbar";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/login");

  const isAdmin = session.user?.role === "ADMIN";

  return (
    <div
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 antialiased overflow-hidden`}
    >
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white dark:bg-zinc-900 flex flex-col border-r border-zinc-200/80 dark:border-zinc-800/80 sticky top-0 h-screen">
        <div className="p-6 flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <h1
              className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Blog Console
            </h1>
          </div>
          <p
            className="text-xs text-zinc-500 dark:text-zinc-500 truncate mt-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {session.user?.email}
          </p>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-violet-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {session.user?.role}
            </span>
          </div>
        </div>

        <SidebarNav isAdmin={isAdmin} />

        <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-3 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Signed in as{" "}
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
              {session.user?.name}
            </span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar userName={session.user?.name ?? ""} />
        <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/60 dark:bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  );
}