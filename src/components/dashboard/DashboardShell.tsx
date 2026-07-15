// components/dashboard/DashboardShell.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Smartphone,
  BarChart3,
  Mail,
  Menu,
  X,
} from "lucide-react";
import SidebarNav from "@/components/layout/SideBarNav";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";

interface DashboardShellProps {
  isAdmin: boolean;
  userName: string;
  userEmail: string;
  userRole: string;
  children: React.ReactNode;
}

// Primary items surfaced in the mobile bottom bar. Kept to 4 + a "More"
// trigger so it never crowds on small screens.
const BOTTOM_NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/posts", label: "Posts", icon: FileText },
  { href: "/dashboard/gadgets", label: "Gadgets", icon: Smartphone },
  { href: "/dashboard/polls", label: "Polls", icon: BarChart3 },
];

export default function DashboardShell({
  isAdmin,
  userName,
  userEmail,
  userRole,
  children,
}: DashboardShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 overflow-hidden">
      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar: static on desktop, sliding drawer on mobile/tablet */}
      <aside
        className={`
          w-72 shrink-0 bg-white dark:bg-zinc-900 flex flex-col
          border-r border-zinc-200/80 dark:border-zinc-800/80
          fixed inset-y-0 left-0 z-50 h-screen
          transition-transform duration-300 ease-out
          lg:sticky lg:top-0 lg:translate-x-0
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-6 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <h1
                className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Blog Console
              </h1>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p
            className="text-xs text-zinc-500 dark:text-zinc-500 truncate mt-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {userEmail}
          </p>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-blue-500 text-white shadow-sm shadow-blue-500/30">
              {userRole}
            </span>
          </div>
        </div>

        <div onClick={() => setDrawerOpen(false)}>
          <SidebarNav isAdmin={isAdmin} />
        </div>

        <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-3 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Signed in as{" "}
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
              {userName}
            </span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar userName={userName} onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-24 lg:pb-8 bg-zinc-50/60 dark:bg-zinc-950">
          {children}
        </main>

        {/* Bottom nav — phones only */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-stretch">
            {BOTTOM_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                    active
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              );
            })}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
            >
              <Menu className="h-5 w-5" />
              More
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}