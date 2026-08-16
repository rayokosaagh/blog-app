"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

function hrefForPage(searchParams: URLSearchParams, basePath: string, page: number) {
  const params = new URLSearchParams(searchParams);
  if (page <= 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

// Collapses a long run of pages into first/last + a window around the
// current page, e.g. 1 … 4 5 [6] 7 8 … 42, so the control stays scannable
// no matter how many pages of content exist.
function pageWindow(current: number, total: number) {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
}

export default function Pagination({
  basePath,
  currentPage,
  totalPages,
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
}) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const pages = pageWindow(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 flex items-center justify-center gap-2 flex-wrap"
    >
      <PageLink
        disabled={currentPage <= 1}
        href={hrefForPage(searchParams, basePath, currentPage - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </PageLink>

      {pages.map((page, i) => {
        const prev = pages[i - 1];
        const showGap = prev !== undefined && page - prev > 1;
        return (
          <span key={page} className="flex items-center gap-2">
            {showGap && (
              <span className="text-muted-foreground text-sm px-1 select-none">…</span>
            )}
            <PageLink
              href={hrefForPage(searchParams, basePath, page)}
              active={page === currentPage}
            >
              {page}
            </PageLink>
          </span>
        );
      })}

      <PageLink
        disabled={currentPage >= totalPages}
        href={hrefForPage(searchParams, basePath, currentPage + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  active,
  disabled,
  children,
  ...rest
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  const base =
    "min-w-9 h-9 px-2.5 inline-flex items-center justify-center text-sm font-bold border-2 border-border-heavy rounded-none transition-colors";

  if (disabled) {
    return (
      <span
        className={`${base} bg-card text-muted-foreground opacity-40 cursor-not-allowed`}
        aria-disabled="true"
        {...rest}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`${base} shadow-brutal-sm brutal-press ${
        active ? "bg-accent text-on-accent" : "bg-card text-foreground hover:bg-accent-tint"
      }`}
      aria-current={active ? "page" : undefined}
      {...rest}
    >
      {children}
    </Link>
  );
}
