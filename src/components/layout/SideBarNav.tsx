"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Smartphone,
  Layers,
  Megaphone,
  Image as ImageIcon,
  Mail,
  BarChart3,
  Share2,
  Users,
  Palette,
  MessageCircle,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

interface NavSection {
  /** Omitted for the lead section, which needs no label above it. */
  heading?: string;
  items: NavItem[];
}

/**
 * Grouped by what the operator is trying to do, not by which model backs the
 * page — twelve equally-weighted links read as a list to scan rather than a
 * structure to navigate.
 *
 * A section whose items are all `adminOnly` disappears in full for editors,
 * heading included; see `sections` below.
 */
const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ label: "Overview", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    heading: "Content",
    items: [
      { label: "Posts", href: "/dashboard/posts", icon: FileText },
      { label: "Comments", href: "/dashboard/comments", icon: MessageCircle },
      { label: "Gadgets", href: "/dashboard/gadgets", icon: Smartphone },
      { label: "Comparisons", href: "/dashboard/gadgets/comparisons", icon: Layers },
    ],
  },
  {
    heading: "Audience",
    items: [
      { label: "Newsletter", href: "/dashboard/newsletter", icon: Mail },
      { label: "Polls", href: "/dashboard/polls", icon: BarChart3 },
    ],
  },
  {
    heading: "Promotions",
    items: [
      { label: "Ads", href: "/dashboard/ads", icon: Megaphone, adminOnly: true },
      { label: "Banners", href: "/dashboard/banners", icon: ImageIcon, adminOnly: true },
    ],
  },
  {
    heading: "Settings",
    items: [
      { label: "Socials", href: "/dashboard/socials", icon: Share2, adminOnly: true },
      { label: "Appearance", href: "/dashboard/ui", icon: Palette, adminOnly: true },
      { label: "Users", href: "/dashboard/users", icon: Users, adminOnly: true },
    ],
  },
];

export default function SidebarNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  // Drop hidden items first, then drop sections left empty — otherwise an
  // editor sees a "Promotions" heading with nothing under it.
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.adminOnly || isAdmin),
  })).filter((section) => section.items.length > 0);

  const items = sections.flatMap((section) => section.items);

  // Nested routes (e.g. "/dashboard/gadgets" and "/dashboard/gadgets/comparisons")
  // can both prefix-match the same pathname. Only the longest — i.e. most
  // specific — match should ever be marked active, otherwise two items
  // fight over the shared layoutId pill and one renders blank.
  const activeHref = items.reduce<string | null>((best, item) => {
    const matches =
      item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (!matches) return best;
    if (!best || item.href.length > best.length) return item.href;
    return best;
  }, null);

  return (
    <nav className="h-full overflow-y-auto px-3 py-2">
      {sections.map((section, i) => (
        <div key={section.heading ?? "primary"} className={i === 0 ? "" : "mt-5"}>
          {section.heading && (
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
              {section.heading}
            </p>
          )}

          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = item.href === activeHref;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  {active && (
                    <motion.span
                      layoutId="active-nav-pill"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/25"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon
                    className={`relative z-10 h-4 w-4 shrink-0 transition-colors ${
                      active
                        ? "text-white"
                        : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                    }`}
                  />
                  <span
                    className={`relative z-10 transition-colors ${
                      active
                        ? "text-white"
                        : "text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}