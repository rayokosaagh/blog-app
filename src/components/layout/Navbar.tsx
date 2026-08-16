"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import SignOutButton from "@/components/layout/SignOutButton";
import NavbarSearch from "@/components/layout/NavbarSearch";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ExploreMenu from "@/components/layout/ExploreMenu";
import { Newspaper, Smartphone, Scale, Gauge, LogOut, X, Bookmark, User } from "lucide-react";

// "Blog" and "Gadgets" are the two things this site actually is — leading
// with both, as equal-weight nouns, is what tells a first-time visitor
// there are two separate experiences here instead of one blended feed.
// "Compare" stays as a secondary tool link since it's a specific utility
// (the multi-way spec comparison), not another top-level content type.
const NAV_LINKS = [
  { href: "/blog", label: "Blog", authOnly: false, Icon: Newspaper },
  { href: "/products", label: "Gadgets", authOnly: false, Icon: Smartphone },
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setIsOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActiveLink = (href: string) => {
    if (pathname === href || pathname.startsWith(`${href}/`)) return true;
    // Product detail pages live at the singular /product/[slug], a
    // different route from the /products listing — without this, "Gadgets"
    // wouldn't highlight while actually looking at a gadget.
    if (href === "/products" && pathname.startsWith("/product/")) return true;
    return false;
  };

  const visibleLinks = NAV_LINKS.filter((link) => {
    if (!link.authOnly) return true;
    return !!session && session.user?.role !== "READER";
  });

  // Shared classes for the nav-link "icon utility button" treatment.
  // rounded-none/border-2 -> surface-border-w (themed width + radius),
  // colors stay as Tailwind border-color utilities so active/inactive
  // states still work.
  const navLinkClass = (active: boolean) =>
    `relative flex items-center gap-1.5 px-3 py-2 surface-border-w whitespace-nowrap uppercase text-xs font-extrabold tracking-wide transition-colors duration-100 ${
      active
        ? "border-border-heavy bg-foreground text-background"
        : "border-transparent text-muted-foreground hover:border-border-heavy hover:bg-accent-2 hover:text-on-accent-2"
    }`;

  return (
    <>
    {/*
      Flat masthead: thick top/bottom rule in brutalist mode, thin in
      modern (see .header-frame overrides in globals.css). Scroll shadow
      is a hard step in brutalist, a soft themed shadow in modern.
    */}
    <header
      className={`header-frame sticky top-0 z-[100] w-full bg-background border-t-4 border-b-2 border-border-heavy transition-shadow duration-150 ${
        isScrolled ? "header-frame-scrolled shadow-[0_4px_0_0_var(--border-heavy)]" : ""
      }`}
    >
      <div className="mx-auto w-full max-w-[1560px] text-foreground">
        <div className="flex w-full items-center justify-between gap-4 px-6 h-16">
          <motion.div className="flex-shrink-0" whileTap={{ scale: 0.97 }}>
            <Link
              href="/"
              className="text-xl font-black tracking-tight hover:text-accent transition-colors duration-100"
            >
              Blog
            </Link>
          </motion.div>

          <div className="flex flex-1 min-w-0 px-2 md:px-4 w-full max-w-2xl">
            <NavbarSearch />
          </div>

          <nav className="hidden md:flex items-center text-sm font-bold">
            <div className="flex items-center gap-1 mr-6">
              <ThemeToggle />

              <div className="flex items-center gap-1 ml-2">
                <ExploreMenu />
                {visibleLinks.map((link) => {
                  const active = isActiveLink(link.href);
                  const Icon = link.Icon;
                  return (
                    <Link key={link.href} href={link.href} className={navLinkClass(active)}>
                      <Icon className="h-4 w-4" strokeWidth={2.25} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="w-[2px] h-5 bg-border-heavy mr-6" />

            {status === "loading" ? (
              <div className="w-9 h-9 surface-border-w border-border-heavy animate-pulse" />
            ) : session ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center justify-center w-9 h-9 surface-border-w border-border-heavy text-foreground shadow-brutal-sm brutal-press overflow-hidden"
                >
                  {session.user?.image ? (
                    <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.12, ease: "easeOut" }}
                      className="absolute left-1/2 -translate-x-1/2 mt-3 w-64 origin-top"
                    >
                      <div className="bg-card surface-border-w border-border-heavy shadow-brutal">
                        <div className="flex items-center gap-3 px-4 py-3.5 border-b-2 border-border">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden surface-border-w border-border-heavy text-foreground">
                            {session.user?.image ? (
                              <img src={session.user.image} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-foreground">{session.user?.name || "User"}</p>
                            <p className="truncate text-xs text-muted-foreground">{session.user?.email}</p>
                          </div>
                        </div>

                        <div className="px-2 py-2 space-y-0.5">
                          <Link
                            href="/account"
                            onClick={() => setIsProfileOpen(false)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent-tint transition-colors duration-100 font-extrabold uppercase tracking-wide text-xs"
                            style={{ borderRadius: "var(--radius)" }}
                          >
                            <User className="h-4 w-4" />
                            Profile
                          </Link>
                          <Link
                            href="/bookmarks"
                            onClick={() => setIsProfileOpen(false)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent-tint transition-colors duration-100 font-extrabold uppercase tracking-wide text-xs"
                            style={{ borderRadius: "var(--radius)" }}
                          >
                            <Bookmark className="h-4 w-4" />
                            Bookmarks
                          </Link>
                        </div>
                        <div className="px-2 pb-2">
                          <SignOutButton
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 transition-colors duration-100 text-left font-extrabold uppercase tracking-wide text-xs cursor-pointer"
                          >
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
              <Link
                href="/login"
                className="px-5 py-2.5 surface-border-w border-border-heavy bg-background text-foreground hover:bg-accent hover:text-on-accent font-extrabold uppercase text-xs tracking-wide shadow-brutal-sm brutal-press"
              >
                Sign In
              </Link>
            )}
          </nav>

          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            /* `focus:outline-none` with no replacement left the primary mobile
               nav control with no visible focus state, so a keyboard user
               tabbing the header lost the cursor entirely. Swapped for the
               focus ring used elsewhere in the codebase. */
            className="md:hidden p-2 surface-border-w border-border-heavy text-foreground hover:bg-accent-2 hover:text-on-accent-2 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
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
          </button>
        </div>
      </div>
    </header>

    {mounted && createPortal(
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="mobile-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="md:hidden fixed inset-0 z-[110] bg-black/50"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              key="mobile-nav-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
              className="md:hidden fixed top-0 right-0 z-[111] h-full w-[80%] max-w-[300px]"
            >
              <div className="relative h-full bg-background border-l-4 border-border-heavy flex flex-col overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-4 border-b-2 border-border">
                  {session ? (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden surface-border-w border-border-heavy text-foreground">
                        {session.user?.image ? (
                          <img src={session.user.image} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 opacity-80" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground leading-tight">
                          {session.user?.name || "User"}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground leading-tight">
                          {session.user?.email}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-lg font-black tracking-tight text-foreground">Blog</span>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    aria-label="Close menu"
                    className="shrink-0 p-1.5 surface-border-w border-transparent text-foreground hover:bg-accent-2 hover:text-on-accent-2 hover:border-border-heavy transition-colors duration-100"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="flex-1 px-4 py-5 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                      Menu
                    </span>
                    <ThemeToggle />
                  </div>

                  <nav className="flex flex-col gap-1 text-sm font-bold">
                    <ExploreMenu variant="inline" onNavigate={() => setIsOpen(false)} />
                    {visibleLinks.map((link) => {
                      const active = isActiveLink(link.href);
                      const Icon = link.Icon;
                      return (
                        <Link key={link.href} href={link.href} className={`w-full ${navLinkClass(active)}`}>
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{link.label}</span>
                        </Link>
                      );
                    })}

                    {session && (
                      <>
                        <Link href="/account" className={`w-full ${navLinkClass(isActiveLink("/account"))}`}>
                          <User className="h-4 w-4 shrink-0" />
                          <span className="truncate">Profile</span>
                        </Link>
                        <Link href="/bookmarks" className={`w-full ${navLinkClass(isActiveLink("/bookmarks"))}`}>
                          <Bookmark className="h-4 w-4 shrink-0" />
                          <span className="truncate">Bookmarks</span>
                        </Link>
                      </>
                    )}
                  </nav>

                  <div className="mt-auto pt-4">
                    {session ? (
                      <SignOutButton className="flex justify-center items-center gap-2 w-full py-2.5 surface-border-w border-border-heavy text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 transition-colors duration-100 font-extrabold uppercase text-xs tracking-wide cursor-pointer">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </SignOutButton>
                    ) : (
                      <Link
                        href="/login"
                        className="flex justify-center items-center gap-2 w-full py-2.5 surface-border-w border-border-heavy text-foreground font-extrabold uppercase text-xs tracking-wide shadow-brutal-sm brutal-press"
                      >
                        Sign In
                      </Link>
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