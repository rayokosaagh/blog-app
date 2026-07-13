// components/DashboardTopbar.tsx
"use client";

import ThemeToggle from "@/components/ui/ThemeToggle";
import SignOutButton from "@/components/layout/SignOutButton";
import { LogOut } from "lucide-react";
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

export default function DashboardTopbar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const title =
    Object.entries(TITLES).find(
      ([href]) => pathname.startsWith(href) && (href === "/dashboard" ? pathname === href : true)
    )?.[1] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl">
      <h2
        className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
        <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:inline">
          {userName}
        </span>
        <SignOutButton className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
          <LogOut className="h-4 w-4" />
          Sign out
        </SignOutButton>
      </div>
    </header>
  );
}