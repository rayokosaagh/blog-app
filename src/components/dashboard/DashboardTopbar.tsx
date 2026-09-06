"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SignOutButton from "@/components/layout/SignOutButton";
import { LogOut, Menu, Home } from "lucide-react";
import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/posts": "Posts",
  "/dashboard/gadgets": "Gadgets",
  "/dashboard/polls": "Polls",
  "/dashboard/newsletter": "Newsletter",
  "/dashboard/ads": "Ads",
  "/dashboard/banners": "Banners",
  "/dashboard/socials": "Socials",
  "/dashboard/users": "Users",
};

export default function DashboardTopbar({
  userName,
  onMenuClick,
}: {
  userName: string;
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const title =
    Object.entries(TITLES).find(
      ([href]) => pathname.startsWith(href) && (href === "/dashboard" ? pathname === href : true)
    )?.[1] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2
          className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
        <ThemeToggle />
        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
        <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:inline">
          {userName}
        </span>
        <SignOutButton className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </SignOutButton>
      </div>
    </header>
  );
}