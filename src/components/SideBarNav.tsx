// components/SidebarNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";

interface SidebarNavProps {
  isAdmin: boolean;
}

export default function SidebarNav({ isAdmin }: SidebarNavProps) {
  const pathname = usePathname();

  const baseLinks = [
    { href: "/dashboard", label: "Overview", icon: <HomeIcon /> },
    { href: "/dashboard/posts", label: "Posts", icon: <PostIcon /> },
    { href: "/dashboard/posts/new", label: "New Post", icon: <EditIcon /> },
  ];

  const adminLinks = [
    { href: "/dashboard/users", label: "Users", icon: <UsersIcon /> },
    { href: "/dashboard/banners", label: "Banners", icon: <LayersIcon /> },
    { href: "/dashboard/ads", label: "Ads", icon: <MegaphoneIcon /> },
    { href: "/dashboard/socials", label: "Social Links", icon: <LinkIcon /> },
    { href: "/dashboard/polls", label: "Polls", icon: <PollIcon /> },   // ← Added
  ];

  const renderLink = (link: { href: string; label: string; icon: React.ReactNode }) => {
    const isActive = pathname === link.href;

    return (
      <Link
        key={link.href}
        href={link.href}
        className={`relative flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-300 ${
          isActive
            ? "text-zinc-950 dark:text-zinc-50 font-semibold"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        }`}
      >
        {/* The Liquid Sliding Indicator */}
        {isActive && (
          <motion.div
            layoutId="liquid-pill"
            className="absolute inset-0 bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-zinc-700/50 rounded-xl -z-10"
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 30,
            }}
          />
        )}

        <span className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-105" : "opacity-70"}`}>
          {link.icon}
        </span>
        {link.label}
      </Link>
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 pt-2">
      {/* Scrollable links container */}
      <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] no-scrollbar">
        {baseLinks.map(renderLink)}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="flex items-center gap-2 px-4 pt-5 pb-2">
              <span className="text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
                Admin Settings
              </span>
              <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
              <ThemeToggle size="sm" />
            </div>
            {adminLinks.map(renderLink)}
          </>
        )}
      </nav>

      {/* Sign Out Action */}
      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50/60 dark:hover:bg-rose-500/10 transition-all duration-200 w-full group"
        >
          <span className="w-5 h-5 transition-transform group-hover:translate-x-0.5">
            <LogOutIcon />
          </span>
          Sign Out
        </Link>
      </div>
    </div>
  );
}

// Minimalistic Modern SVGs to replace old Emojis
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const PostIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

const LayersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-4.477a1.125 1.125 0 0 1 1.092 0L21.75 12M2.25 12l8.954 4.477a1.125 1.125 0 0 0 1.092 0L21.75 12M2.25 12V16.5A2.25 2.25 0 0 0 4.5 18.75h15A2.25 2.25 0 0 0 21.75 16.5V12M2.25 7.5l8.954-4.477a1.125 1.125 0 0 1 1.092 0L21.75 7.5M2.25 7.5 11.204 12a1.125 1.125 0 0 0 1.092 0L21.75 7.5" />
  </svg>
);

const MegaphoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.68-.69-1.5-1.39-2.34-2.1M10.34 15.84c.42.42.7.97.81 1.56l.57 3.01c.1.53-.29 1.03-.83 1.03-.41 0-.75-.27-.83-.67l-.54-2.61c-.1-.48-.42-.88-.87-1.07l-2.07-.84c-.42-.17-.67-.6-.6-1.05l.38-2.4c.08-.5.45-.9 1-.98l2.92-.45c.57-.09 1.14.15 1.41.67ZM10.34 15.84h1.53c1.07 0 2.05-.53 2.64-1.42l3.43-5.14c.48-.73.28-1.7-.45-2.18l-1.02-.68c-.73-.48-1.7-.28-2.18.45l-3.43 5.14c-.6.89-1.58 1.42-2.64 1.42H10.34Z" />
  </svg>
);

const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
  </svg>
);

// New Poll Icon
const PollIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 8.637 6.637 5 11.125 5c4.488 0 8.125 3.637 8.125 8.125 0 4.488-3.637 8.125-8.125 8.125S3 17.613 3 13.125z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m-3-3h6" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 3v3M9 3v3" />
  </svg>
);

const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
  </svg>
);