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

const MIN_QUERY_LENGTH = 2;

export default function NavbarSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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
        setIsOpen(trimmedQuery.length > 0); // show the "type more" hint, but only once they've typed something
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`);
        const data = await res.json();

        setResults(data.results || []);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [trimmedQuery]);

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
            placeholder="Search posts..."
            className="w-full px-5 py-2.5 pr-10 text-sm
                       bg-background text-foreground placeholder-muted-foreground
                       border-2 border-border-heavy rounded-none
                       shadow-brutal-sm
                       focus:outline-none focus:border-accent
                       transition-colors duration-100"
          />

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

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-card border-2 border-border-heavy rounded-none shadow-brutal">
          <ul className="py-1 max-h-80 overflow-y-auto">
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

      {/* No Results */}
      {isOpen && trimmedQuery.length >= MIN_QUERY_LENGTH && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-2 bg-card border-2 border-border-heavy rounded-none shadow-brutal">
          <div className="px-5 py-4 text-sm text-muted-foreground text-center">
            No posts found for "{trimmedQuery}"
          </div>
        </div>
      )}
    </div>
  );
}