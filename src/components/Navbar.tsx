"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Scale, Gauge, LogOut, X } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";
import NavbarSearch from "@/components/NavbarSearch";
import ThemeToggle from "@/components/ThemeToggle";
import ExploreMenu from "@/components/ExploreMenu";

const NAV_LINKS = [
  { href: "/blog", label: "Posts", authOnly: false, Icon: Newspaper },
  { href: "/compare", label: "Compare", authOnly: false, Icon: Scale },
  { href: "/dashboard", label: "Dashboard", authOnly: true, Icon: Gauge },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Portals must only run client-side, after mount, since document.body
  // isn't available during SSR.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Close menus on navigation
  useEffect(() => {
    setIsOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  // Lock scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  // Track scroll position
useEffect(() => {
  let ticking = false;
  const handleScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      setIsScrolled((prev) => {
        if (prev) return window.scrollY > 8;
        return window.scrollY > 20;
      });
      ticking = false;
    });
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

  // Click outside listener for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActiveLink = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const visibleLinks = NAV_LINKS.filter((link) => {
    if (!link.authOnly) return true;
    return !!session && session.user?.role !== "READER";
  });

  return (
    <>
    <header
  className={`sticky top-0 z-[100] w-full relative transition-[padding] duration-500 ease-out ${
    isScrolled ? "px-3 pt-3" : "bg-white/90 dark:bg-[#0a1322]/90"
  }`}
>
      {/* Top blur strip — fills only the gap between the page's top edge and
          the pill's top edge (height matches the header's own pt-3). Inset
          left/right so it stays clear of the pill's rounded corners — a
          full-width strip would overhang those curves and show up as a
          small square patch right at the corners (where the pill's edge
          recedes inward but the strip above stayed square). */}
      <div
        className={`pointer-events-none absolute left-10 right-10 sm:left-14 sm:right-14 top-0 transition-[height,opacity] duration-500 ease-out ${
          isScrolled
            ? "h-3 opacity-100 backdrop-blur-2xl backdrop-saturate-150 bg-white/55 dark:bg-[#0c233f]/45"
            : "h-0 opacity-0"
        }`}
      />

      {/* Full-bleed sheen for the flat (unscrolled) state — lives on the
          header itself so it (and the header's background above) spans the
          entire viewport width, not just the mx-auto max-w-[1560px] card
          below. Previously this sheen only lived inside that card, and the
          card carried its own background too — so on viewports wider than
          1560px, the leftover margin outside the card showed the bare page
          background (no bg, no sheen) while the card read visibly lighter.
          That mismatch was the seam. Gated to !isScrolled because in the
          scrolled/pill state the margins around the floating pill are
          supposed to show the page background — that's intentional. */}
      {!isScrolled && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/5 to-transparent opacity-80 dark:from-white/10 dark:via-white/0" />
        </div>
      )}

      <div
  className={`relative mx-auto w-full max-w-[1560px] text-gray-900 dark:text-white [transition:max-width_500ms_ease-out,border-radius_500ms_ease-out,box-shadow_500ms_ease-out,backdrop-filter_500ms_ease-out] ${
    isScrolled
      ? "bg-white/55 dark:bg-[#0c233f]/45 backdrop-blur-2xl backdrop-saturate-150 rounded-full shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] md:max-w-[1400px]"
      : "rounded-none"
  }`}
>
        {/* Specular sheen — the glass "catches the light" along the top edge.
            Clipped in its own overflow-hidden wrapper (rounded to match the
            card shape) so it never needs to clip the rest of the header —
            that overflow-hidden used to also clip the profile dropdown.
            Only rendered in the scrolled/pill state now — the flat state's
            sheen is handled at the header level above so it can span the
            full viewport width instead of just this max-w card. */}
        {isScrolled && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/5 to-transparent opacity-80 dark:from-white/10 dark:via-white/0" />
          </div>
        )}

        {/* Top row — logo, desktop search/links, mobile hamburger */}
        <div
          className={`relative z-10 flex w-full items-center justify-between gap-4 px-6 [transition:height_500ms_ease-out] ${
            isScrolled ? "h-14" : "h-16"
          }`}
        >
        {/* Left: Logo */}
        <motion.div
          className="relative z-10 flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            href="/"
            className="text-xl font-bold tracking-wide hover:text-[#6f42c1] dark:hover:text-white transition-colors"
          >
            Blog
          </Link>
        </motion.div>

        {/* Center: Dynamic Search Bar — visible at every breakpoint now.
            flex-1 + min-w-0 lets it shrink to fit whatever room is left
            between the logo and the hamburger/auth controls on mobile,
            instead of needing its own separate row. */}
        <div
          className={`relative z-10 flex flex-1 min-w-0 px-2 md:px-4 transition-all duration-500 ease-in-out w-full ${
            isScrolled ? "md:max-w-3xl" : "md:max-w-2xl"
          }`}
        >
          <NavbarSearch />
        </div>

        {/* Right: Desktop Links & Auth */}
        <nav className="relative z-10 hidden md:flex items-center text-sm font-medium">
          <div className="flex items-center gap-2 mr-6">
            <ThemeToggle />

            <div className="flex items-center gap-1 ml-2">
              <ExploreMenu />
              {visibleLinks.map((link, i) => {
                const active = isActiveLink(link.href);
                const Icon = link.Icon;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.3, ease: "easeOut" }}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Link
                      href={link.href}
                      className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                        active
                          ? "text-[#6f42c1] dark:text-white"
                          : "text-gray-600 dark:text-gray-200 hover:text-[#6f42c1] dark:hover:text-white"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="liquid-nav-pill"
                          className="absolute inset-0 -z-10 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-md ring-1 ring-inset ring-white/70 dark:ring-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                      <motion.span
                        className="relative flex items-center justify-center"
                        whileHover={{ rotate: -8, scale: 1.12 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.25} />
                      </motion.span>
                      <span className="relative">{link.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Thin divider — separates browsing/nav controls from the
              account cluster so the two groups read as distinct regions
              instead of one long unbroken row. */}
          <div className="w-px h-5 bg-gray-300/60 dark:bg-white/10 mr-6" />

          {/* Conditional Auth UI */}
          {status === "loading" ? (
            <div className="w-9 h-9 rounded-full bg-gray-200/60 dark:bg-white/10 animate-pulse" />
          ) : session ? (
            <div className="relative" ref={profileRef}>
              <motion.button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/40 dark:bg-white/10 backdrop-blur-md text-gray-700 dark:text-white hover:bg-white/60 dark:hover:bg-white/20 hover:text-[#6f42c1] dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                {session.user?.image ? (
                  <img src={session.user.image} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </motion.button>

              {/* Profile Dropdown — glass card matching the header's language */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute left-1/2 -translate-x-1/2 mt-3 w-64 origin-top"
                  >
                    <div className="relative overflow-hidden rounded-2xl bg-white/95 dark:bg-[#0c233f]/95 backdrop-blur-3xl backdrop-saturate-150 border border-white/60 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                      {/* specular sheen, matches header */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/50 via-white/5 to-transparent opacity-80 dark:from-white/10 dark:via-white/0" />

                      <div className="relative flex items-center gap-3 px-4 py-3.5 border-b border-white/40 dark:border-white/10">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/50 dark:bg-white/10 text-gray-700 dark:text-white">
                          {session.user?.image ? (
                            <img src={session.user.image} alt="Profile" className="h-full w-full object-cover" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{session.user?.name || "User"}</p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{session.user?.email}</p>
                        </div>
                      </div>

                      <div className="relative px-2 py-2">
                        <SignOutButton className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-500/10 rounded-md transition-colors text-left font-medium cursor-pointer">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </SignOutButton>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/login"
                className="px-5 py-2 rounded-full border border-white/60 dark:border-white/20 bg-white/30 dark:bg-white/5 backdrop-blur-md text-gray-700 dark:text-white hover:text-[#6f42c1] dark:hover:text-white hover:border-[#6f42c1] dark:hover:border-white hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-200 font-medium"
              >
                Sign In
              </Link>
            </motion.div>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          className="relative z-10 md:hidden p-2 rounded-full bg-white/30 dark:bg-white/10 backdrop-blur-md text-gray-600 dark:text-gray-200 hover:text-[#6f42c1] dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/20 transition-colors focus:outline-none"
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </motion.button>
        </div>
      </div>
    </header>

    {/* Mobile Right-Side Sliding Panel + Backdrop — rendered via a portal
        into document.body, NOT inside <header>. When the header gets
        backdrop-blur-2xl on scroll, that backdrop-filter creates a new
        containing block for position:fixed descendants (same effect as
        transform), which was clipping this "h-full" panel down to the
        header's own (much shorter) box instead of the real viewport.

        Redesigned as a narrow side drawer (~78% width, capped at 300px)
        instead of the old max-w-sm (384px) panel that swallowed most of
        the screen on small phones. Rounded left edge + inset margin make
        it read as a floating card peeking in from the side, and the
        slide-in now uses a spring for a springier, more fluid feel. */}
    {mounted && createPortal(
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Sliding panel — transform lives on this wrapper only, blur/tint
                live on the untransformed child so browsers don't drop the blur. */}
            <motion.div
              key="mobile-nav-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="md:hidden fixed top-0 right-0 z-[111] h-full w-[78%] max-w-[300px]"
            >
              <div className="relative h-full bg-white/95 dark:bg-[#0c233f]/95 backdrop-blur-3xl backdrop-saturate-150 border-l border-white/60 dark:border-white/10 rounded-l-3xl shadow-[-20px_0_50px_rgba(0,0,0,0.15)] dark:shadow-[-20px_0_50px_rgba(0,0,0,0.4)] flex flex-col overflow-y-auto">
                {/* specular sheen */}
                <div className="pointer-events-none absolute inset-0 rounded-l-3xl overflow-hidden bg-gradient-to-b from-white/50 via-white/5 to-transparent opacity-80 dark:from-white/10 dark:via-white/0" />

                {/* Header row: compact profile identity when signed in, otherwise brand */}
                <div className="relative flex items-center justify-between px-4 py-4 border-b border-white/40 dark:border-white/10">
                  {session ? (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/50 dark:bg-white/10 text-gray-700 dark:text-white">
                        {session.user?.image ? (
                          <img src={session.user.image} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 opacity-80" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                          {session.user?.name || "User"}
                        </p>
                        <p className="truncate text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                          {session.user?.email}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-lg font-bold tracking-wide text-gray-900 dark:text-white">Blog</span>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    aria-label="Close menu"
                    className="shrink-0 p-1.5 rounded-full hover:bg-white/50 dark:hover:bg-white/10 text-gray-500 dark:text-gray-300 hover:text-[#6f42c1] dark:hover:text-white transition-colors"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="relative flex-1 px-4 py-5 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      Menu
                    </span>
                    <ThemeToggle />
                  </div>

                  <nav className="flex flex-col gap-1 text-sm font-medium">
                    <ExploreMenu variant="inline" onNavigate={() => setIsOpen(false)} />
                    {visibleLinks.map((link) => {
                      const active = isActiveLink(link.href);
                      const Icon = link.Icon;
                      return (
                        <motion.div key={link.href} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                          <Link
                            href={link.href}
                            className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl transition-colors ${
                              active
                                ? "bg-white/60 dark:bg-white/10 text-[#6f42c1] dark:text-white backdrop-blur-md"
                                : "text-gray-600 dark:text-gray-200 hover:text-[#6f42c1] dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10"
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{link.label}</span>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </nav>

                  {/* Mobile Auth UI */}
                  <div className="mt-auto pt-4">
                    {session ? (
                      <SignOutButton className="flex justify-center items-center gap-2 w-full py-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all duration-200 font-medium text-sm cursor-pointer">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </SignOutButton>
                    ) : (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Link
                          href="/login"
                          className="flex justify-center items-center gap-2 w-full py-2.5 rounded-xl bg-white/40 dark:bg-white/10 backdrop-blur-md text-gray-700 dark:text-white hover:text-[#6f42c1] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/20 transition-all duration-200 font-medium text-sm"
                        >
                          Sign In
                        </Link>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
}