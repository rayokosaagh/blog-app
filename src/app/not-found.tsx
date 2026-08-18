import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Page not found",
  // A 404 has nothing worth indexing, and letting it into the index dilutes
  // the crawl budget the real posts are competing for.
  robots: { index: false, follow: true },
};

const DESTINATIONS = [
  { href: "/blog", label: "All articles", hint: "Reviews, news and buying advice" },
  { href: "/products", label: "Gadgets", hint: "Browse the product catalogue" },
  { href: "/compare", label: "Compare", hint: "Put two gadgets side by side" },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-24">
        <p className="text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground">
          Error 404
        </p>
        <h1 className="mt-3 text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          The link may be broken, or the article may have been moved or renamed.
          Nothing here is lost — try one of these instead.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {DESTINATIONS.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className="surface-border bg-card shadow-brutal-sm p-5 transition-transform hover:-translate-y-0.5"
            >
              <span className="block font-bold text-foreground">{d.label}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{d.hint}</span>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="surface-border bg-accent text-on-accent shadow-brutal-sm brutal-press px-6 py-3 font-bold"
          >
            Back to home
          </Link>
          <Link href="/search" className="font-bold text-accent hover:underline">
            Search the site instead
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
