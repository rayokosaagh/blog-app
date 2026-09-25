"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import FilterSelect from "@/components/dashboard/FilterSelect";
import { pageWindow } from "@/lib/pagination";

/**
 * Footer pager for dashboard lists that are fetched whole and filtered on the
 * client. Same page-window logic as the public listing pager
 * (`blog/Pagination`), driven by state instead of links, plus a range readout
 * and a page-size picker. Renders nothing while everything fits on the smallest page size.
 */
export default function DashboardPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemLabel = "items",
}: {
  /** 1-based, and already clamped to the page count by the caller. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}) {
  if (total <= pageSizeOptions[0]) return null;

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const pages = pageWindow(page, pageCount);

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
      <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="tabular-nums">
          {first.toLocaleString()}–{last.toLocaleString()} of {total.toLocaleString()} {itemLabel}
        </span>
        <span aria-hidden className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
        <span className="hidden sm:inline">Per page</span>
        <FilterSelect
          ariaLabel="Items per page"
          value={String(pageSize)}
          onChange={(v) => onPageSizeChange(Number(v))}
          options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
          side="top"
          className="w-20"
        />
      </div>

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2">
          <PageButton
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </PageButton>

          {pages.map((p, i) => {
            const prev = pages[i - 1];
            const showGap = prev !== undefined && p - prev > 1;
            return (
              <span key={p} className="flex items-center gap-2">
                {showGap && (
                  <span className="select-none px-1 text-sm text-zinc-400">…</span>
                )}
                <PageButton
                  active={p === page}
                  onClick={() => onPageChange(p)}
                  aria-label={`Page ${p}`}
                >
                  {p}
                </PageButton>
              </span>
            );
          })}

          <PageButton
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </PageButton>
        </nav>
      )}
    </div>
  );
}

function PageButton({
  active,
  disabled,
  onClick,
  children,
  "aria-label": ariaLabel,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  "aria-label": string;
}) {
  const base =
    "min-w-10 h-10 px-3 inline-flex items-center justify-center rounded-xl text-sm font-semibold tabular-nums transition-colors";

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        aria-label={ariaLabel}
        className={`${base} cursor-not-allowed bg-white text-zinc-400 opacity-50 ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:text-zinc-600 dark:ring-zinc-800`}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={`${base} ${
        active
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "bg-white text-zinc-700 ring-1 ring-zinc-200/70 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-800 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}
