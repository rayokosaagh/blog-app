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

    // Don't let a too-short, overly-broad query hit the results page
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setIsOpen(true);
      return;
    }

    setIsOpen(false);
    router.push(`/blog?search=${encodeURIComponent(trimmedQuery)}`);
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
                       bg-white dark:bg-gray-800 
                       border border-gray-300 dark:border-gray-700
                       text-gray-900 dark:text-white 
                       placeholder-gray-500 dark:placeholder-gray-400 
                       rounded-full 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 
                       transition-all duration-300"
          />

          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-gray-400 dark:border-gray-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
          )}

          {/* Clear Button */}
          {!isLoading && query.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
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
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#0c233f] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl">
          <div className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            Type at least {MIN_QUERY_LENGTH} characters to search
          </div>
        </div>
      )}

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#0c233f] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
          <ul className="py-1 max-h-80 overflow-y-auto">
            {results.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 group"
                >
                  {post.featuredImage ? (
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-10 h-10 rounded-md object-cover flex-shrink-0 border border-gray-200 dark:border-gray-600 group-hover:border-blue-500/30 transition-colors"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-600">
                      <span className="text-lg">📝</span>
                    </div>
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-200 group-hover:text-[#0D3B66] dark:group-hover:text-blue-400 font-medium line-clamp-2">
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
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#0c233f] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl">
          <div className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            No posts found for "{trimmedQuery}"
          </div>
        </div>
      )}
    </div>
  );
}