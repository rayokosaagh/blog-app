"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  featuredImage?: string | null;
};

type ProductResult = {
  id: string;
  name: string;
  slug: string;
  brand?: string | null;
  image?: string | null;
};

const MIN_QUERY_LENGTH = 2;

// Typewriter timing (ms)
const TYPE_SPEED = 75; // per character while typing
const DELETE_SPEED = 40; // per character while erasing
const HOLD_MS = 5000; // pause on the full phrase — the 5s between each animation

// Whole product name, but cap very long names at 5 words + ".."
function typewriterLabel(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length > 5) return `${words.slice(0, 5).join(" ")}..`;
  return name.trim();
}

export default function NavbarSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Typewriter placeholder state
  const [phrases, setPhrases] = useState<string[]>([]);
  const [typed, setTyped] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const trimmedQuery = query.trim();
  const isQueryTooShort = trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY_LENGTH;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search results with debounce
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (trimmedQuery.length < MIN_QUERY_LENGTH) {
        setResults([]);
        setProducts([]);
        setIsOpen(trimmedQuery.length > 0); // show the "type more" hint, but only once they've typed something
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`);
        const data = await res.json();

        setResults(data.results || []);
        setProducts(data.products || []);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [trimmedQuery]);

  // Honour the user's reduced-motion preference — no typing animation.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Load product names once, turn each into a "first two words…." phrase.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/gadgets/products")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.products) return;
        const labels = (data.products as { name: string; published?: boolean }[])
          .filter((p) => p.published !== false)
          .map((p) => typewriterLabel(p.name))
          .filter(Boolean);
        setPhrases(Array.from(new Set(labels)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Typewriter loop: type a phrase, hold 5s, erase, move to the next.
  useEffect(() => {
    if (phrases.length === 0 || reducedMotion) {
      setTyped("");
      return;
    }

    let wordIdx = 0;
    let charIdx = 0;
    let phase: "typing" | "pausing" | "deleting" = "typing";
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const word = phrases[wordIdx % phrases.length];

      if (phase === "typing") {
        charIdx++;
        setTyped(word.slice(0, charIdx));
        if (charIdx >= word.length) {
          phase = "pausing";
          timer = setTimeout(tick, HOLD_MS);
        } else {
          timer = setTimeout(tick, TYPE_SPEED);
        }
      } else if (phase === "pausing") {
        phase = "deleting";
        timer = setTimeout(tick, DELETE_SPEED);
      } else {
        charIdx--;
        setTyped(word.slice(0, Math.max(0, charIdx)));
        if (charIdx <= 0) {
          wordIdx++;
          phase = "typing";
          timer = setTimeout(tick, 300);
        } else {
          timer = setTimeout(tick, DELETE_SPEED);
        }
      }
    };

    timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);
  }, [phrases, reducedMotion]);

  // Show the animated placeholder only when the box is idle (empty & unfocused).
  const showTypewriter =
    query === "" && !isFocused && !reducedMotion && phrases.length > 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setIsOpen(true);
      return;
    }

    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setProducts([]);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <form onSubmit={handleSearchSubmit}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={showTypewriter ? "" : "Search posts & products..."}
            className="w-full px-5 py-2.5 pr-10 text-sm
                       bg-background text-foreground placeholder-muted-foreground
                       border-2 border-border-heavy rounded-none
                       shadow-brutal-sm
                       focus:outline-none focus:border-accent
                       transition-colors duration-100"
          />

          {/* Typewriter placeholder — "🔍 Search for <product>…." while idle */}
          {showTypewriter && (
            <div
              aria-hidden
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 flex items-center max-w-[calc(100%-3.5rem)] overflow-hidden whitespace-nowrap text-sm text-muted-foreground select-none"
            >
              <svg
                className="h-4 w-4 mr-2 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="square"
                strokeLinejoin="miter"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span className="truncate">
                Search for {typed}
                <span className="ml-[2px] inline-block h-[1.05em] w-[2px] align-middle bg-foreground animate-pulse" />
              </span>
            </div>
          )}

          {/* Loading indicator — hard-edged pulse, not a spinning ring */}
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-2.5 h-2.5 bg-foreground animate-pulse" />
            </div>
          )}

          {/* Clear Button */}
          {!isLoading && query.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-none border-2 border-transparent text-muted-foreground hover:text-on-accent-2 hover:bg-accent-2 hover:border-border-heavy transition-colors duration-100"
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Too-short hint */}
      {isOpen && isQueryTooShort && (
        <div className="absolute z-50 w-full mt-2 bg-card border-2 border-border-heavy rounded-none shadow-brutal">
          <div className="px-5 py-4 text-sm text-muted-foreground text-center">
            Type at least {MIN_QUERY_LENGTH} characters to search
          </div>
        </div>
      )}

      {/* Results Dropdown — posts + products */}
      {isOpen && (results.length > 0 || products.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-card border-2 border-border-heavy rounded-none shadow-brutal max-h-96 overflow-y-auto">
          {/* Posts */}
          {results.length > 0 && (
            <div>
              <div className="px-5 pt-3 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Posts
              </div>
              <ul className="py-1">
                {results.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/blog/${post.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-accent-tint transition-colors duration-100 border-b-2 border-border last:border-0 group"
                    >
                      {post.featuredImage ? (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-10 h-10 rounded-none object-cover flex-shrink-0 border-2 border-border-heavy"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-none bg-accent-tint flex items-center justify-center flex-shrink-0 border-2 border-border-heavy">
                          <span className="text-lg">📝</span>
                        </div>
                      )}
                      <span className="text-sm text-foreground group-hover:text-accent font-bold line-clamp-2">
                        {post.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Products */}
          {products.length > 0 && (
            <div>
              <div className="px-5 pt-3 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground border-t-2 border-border">
                Products
              </div>
              <ul className="py-1">
                {products.map((prod) => (
                  <li key={prod.id}>
                    <Link
                      href={`/product/${prod.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-accent-tint transition-colors duration-100 border-b-2 border-border last:border-0 group"
                    >
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-10 h-10 rounded-none object-cover flex-shrink-0 border-2 border-border-heavy"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-none bg-accent-tint flex items-center justify-center flex-shrink-0 border-2 border-border-heavy">
                          <span className="text-lg">📱</span>
                        </div>
                      )}
                      <span className="min-w-0">
                        <span className="block text-sm text-foreground group-hover:text-accent font-bold line-clamp-1">
                          {prod.name}
                        </span>
                        {prod.brand && (
                          <span className="block text-xs text-muted-foreground truncate">
                            {prod.brand}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {/* Jump to the full product listing, filtered by this query */}
              <Link
                href={`/products?search=${encodeURIComponent(trimmedQuery)}`}
                onClick={() => setIsOpen(false)}
                className="block border-t-2 border-border px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-accent hover:bg-accent-tint transition-colors duration-100"
              >
                See all products for &ldquo;{trimmedQuery}&rdquo; →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {isOpen &&
        trimmedQuery.length >= MIN_QUERY_LENGTH &&
        results.length === 0 &&
        products.length === 0 &&
        !isLoading && (
          <div className="absolute z-50 w-full mt-2 bg-card border-2 border-border-heavy rounded-none shadow-brutal">
            <div className="px-5 py-4 text-sm text-muted-foreground text-center">
              No posts or products found for "{trimmedQuery}"
            </div>
          </div>
        )}
    </div>
  );
}