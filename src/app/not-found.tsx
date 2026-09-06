import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, ChevronRight, Compass, Home, Scale, Search, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RequestedPath from "@/components/ui/RequestedPath";

export const metadata: Metadata = {
  title: "Page not found",
  // A 404 has nothing worth indexing, and letting it into the index dilutes
  // the crawl budget the real posts are competing for.
  robots: { index: false, follow: true },
};

/** Bottom rail. Every href is a route that actually resolves — a dead link on
 *  the 404 page is the one place it is least forgivable. */
const DESTINATIONS = [
  {
    href: "/reviews",
    Icon: Compass,
    label: "Explore our latest reviews",
    hint: "In-depth gadget reviews",
  },
  {
    href: "/compare",
    Icon: Scale,
    label: "Compare products",
    hint: "Put two gadgets side by side",
  },
  {
    href: "/products",
    Icon: Sparkles,
    label: "Check out new gadgets",
    hint: "The latest phones, laptops and more",
  },
];

const HELP = [
  { href: "/search", Icon: Search, label: "Search the site" },
  { href: "/blog", Icon: Compass, label: "Browse all articles" },
];

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-6 py-12 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-accent sm:text-sm">
              Oops! This page went missing
            </p>

            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              This page
              <br />
              <span className="text-accent">can&apos;t</span> be found
            </h1>

            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              The link may be broken, or the article may have been moved or
              renamed. Nothing here is lost — try one of the routes below.
            </p>

            <RequestedPath />

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 surface-pill border-border-heavy bg-accent px-6 py-3 text-sm font-extrabold text-on-accent shadow-brutal-sm brutal-press"
              >
                <Home className="h-4 w-4" strokeWidth={2.5} />
                Back to home
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 surface-pill border-border-heavy bg-card px-6 py-3 text-sm font-extrabold text-foreground shadow-brutal-sm brutal-press"
              >
                <Search className="h-4 w-4" strokeWidth={2.5} />
                Search instead
              </Link>
            </div>

            <div className="mt-10 max-w-sm">
              <h2 className="text-base font-extrabold text-foreground">
                Still need help?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Start from one of these instead.
              </p>

              <ul className="mt-4">
                {HELP.map(({ href, Icon, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="group flex items-center gap-3 border-t-2 border-border py-3 text-sm font-bold text-foreground transition-colors hover:text-accent"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
                      <span className="min-w-0 flex-1">{label}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Illustration. The artwork carries its own night-sky background, so
              it sits in a framed panel and reads the same in light and dark
              rather than being tinted by whichever mode is active. */}
          <div className="relative overflow-hidden surface-border border-border-heavy bg-[#0d1220] shadow-brutal">
            <Image
              src="/404-robot.png"
              alt="A robot sitting beside a sign reading 404, page not found"
              width={900}
              height={670}
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Destination rail — one panel, split into three, mirroring the row
            under the illustration in the reference design. */}
        <div className="mt-12 grid overflow-hidden surface-border border-border-heavy bg-card shadow-brutal sm:grid-cols-3">
          {DESTINATIONS.map(({ href, Icon, label, hint }, i) => (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 p-5 transition-colors hover:bg-accent-tint ${
                i > 0 ? "border-t-2 border-border sm:border-l-2 sm:border-t-0" : ""
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center surface-pill border-border-heavy bg-accent-tint text-accent">
                <Icon className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold text-foreground">
                  {label}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {hint}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent" />
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
